import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 교육 자료 목록 조회 API
 * GET /api/training-materials
 */
export async function GET(request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isPublished = searchParams.get("isPublished");

    // 먼저 training_material_media 테이블이 있는지 확인하기 위해 조인 쿼리 시도
    let query = supabase
      .from("training_materials")
      .select(`
        *,
        media:training_material_media(
          id,
          media_type,
          media_url,
          display_order
        )
      `)
      .order("created_at", { ascending: false });

    // 카테고리 필터
    if (category) {
      query = query.eq("category", category);
    }

    // 발행 여부 필터 (관리자가 아닌 경우 발행된 것만)
    if (user.role !== "ADMIN") {
      query = query.eq("is_published", true);
    } else if (isPublished !== null) {
      query = query.eq("is_published", isPublished === "true");
    }

    let { data: materials, error } = await query;

    // training_material_media 테이블이 없거나 조인 실패 시, 기본 쿼리로 재시도
    if (error && (error.message?.includes("training_material_media") || error.code === "PGRST116")) {
      console.warn("training_material_media 테이블이 없어 기본 쿼리로 재시도합니다:", error.message);
      
      // 기본 쿼리로 재시도
      let basicQuery = supabase
        .from("training_materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (category) {
        basicQuery = basicQuery.eq("category", category);
      }

      if (user.role !== "ADMIN") {
        basicQuery = basicQuery.eq("is_published", true);
      } else if (isPublished !== null) {
        basicQuery = basicQuery.eq("is_published", isPublished === "true");
      }

      const result = await basicQuery;
      materials = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Fetch training materials error:", error);
      return NextResponse.json(
        { error: "교육 자료 목록을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 데이터 변환 (snake_case -> camelCase)
    const transformedMaterials = (materials || []).map((material) => {
      // media 배열이 있으면 사용, 없으면 기존 media_type/media_url 사용 (하위 호환성)
      const mediaItems = material.media && material.media.length > 0
        ? material.media
            .sort((a, b) => a.display_order - b.display_order)
            .map((m) => ({
              id: m.id,
              mediaType: m.media_type,
              mediaUrl: m.media_url,
              displayOrder: m.display_order,
            }))
        : material.media_type && material.media_url
        ? [
            {
              id: null,
              mediaType: material.media_type,
              mediaUrl: material.media_url,
              displayOrder: 0,
            },
          ]
        : [];

      return {
        id: material.id,
        title: material.title,
        description: material.description,
        category: material.category,
        mediaItems: mediaItems,
        // 하위 호환성을 위해 첫 번째 미디어를 mediaType/mediaUrl로도 제공
        mediaType: mediaItems.length > 0 ? mediaItems[0].mediaType : material.media_type,
        mediaUrl: mediaItems.length > 0 ? mediaItems[0].mediaUrl : material.media_url,
        isPublished: material.is_published,
        createdAt: material.created_at,
        updatedAt: material.updated_at,
      };
    });

    return NextResponse.json({ materials: transformedMaterials });
  } catch (error) {
    console.error("Training materials API error:", error);
    return NextResponse.json(
      { error: "교육 자료 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 교육 자료 등록 API
 * POST /api/training-materials
 * ADMIN만 접근 가능
 */
export async function POST(request) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, mediaItems, isPublished } = body;

    // 입력값 검증
    if (!title || !category) {
      return NextResponse.json(
        { error: "제목과 카테고리는 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    // mediaItems 배열 검증
    if (!mediaItems || !Array.isArray(mediaItems) || mediaItems.length === 0) {
      return NextResponse.json(
        { error: "최소 하나의 미디어를 등록해야 합니다." },
        { status: 400 }
      );
    }

    const validMediaTypes = ["PDF", "VIDEO", "LINK", "IMAGE", "NOTION", "YOUTUBE", "DOCUMENT", "FILE"];
    for (const mediaItem of mediaItems) {
      if (!mediaItem.mediaType || !mediaItem.mediaUrl) {
        return NextResponse.json(
          { error: "모든 미디어 항목에 미디어 타입과 URL이 필요합니다." },
          { status: 400 }
        );
      }
      if (!validMediaTypes.includes(mediaItem.mediaType)) {
        return NextResponse.json(
          { error: `올바른 미디어 타입을 입력해주세요: ${mediaItem.mediaType}` },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // 교육 자료 생성
    const { data: material, error: materialError } = await supabase
      .from("training_materials")
      .insert({
        title,
        description: description || null,
        category,
        is_published: isPublished || false,
      })
      .select()
      .single();

    if (materialError) {
      console.error("Create training material error:", materialError);
      return NextResponse.json(
        { error: materialError.message || "교육 자료 등록 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 미디어 항목들 생성
    const mediaToInsert = mediaItems.map((item, index) => ({
      training_material_id: material.id,
      media_type: item.mediaType,
      media_url: item.mediaUrl,
      display_order: item.displayOrder !== undefined ? item.displayOrder : index,
    }));

    const { error: mediaError } = await supabase
      .from("training_material_media")
      .insert(mediaToInsert);

    if (mediaError) {
      console.error("Create training material media error:", mediaError);
      // 롤백: 생성된 교육 자료 삭제
      await supabase.from("training_materials").delete().eq("id", material.id);
      return NextResponse.json(
        { error: mediaError.message || "미디어 등록 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 생성된 미디어 항목들 조회
    const { data: createdMedia, error: fetchMediaError } = await supabase
      .from("training_material_media")
      .select("*")
      .eq("training_material_id", material.id)
      .order("display_order", { ascending: true });

    const transformedMediaItems = (createdMedia || []).map((m) => ({
      id: m.id,
      mediaType: m.media_type,
      mediaUrl: m.media_url,
      displayOrder: m.display_order,
    }));

    return NextResponse.json(
      {
        material: {
          id: material.id,
          title: material.title,
          description: material.description,
          category: material.category,
          mediaItems: transformedMediaItems,
          mediaType: transformedMediaItems.length > 0 ? transformedMediaItems[0].mediaType : null,
          mediaUrl: transformedMediaItems.length > 0 ? transformedMediaItems[0].mediaUrl : null,
          isPublished: material.is_published,
          createdAt: material.created_at,
          updatedAt: material.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Training material create error:", error);
    return NextResponse.json(
      { error: "교육 자료 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

