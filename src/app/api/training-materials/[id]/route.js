import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 교육 자료 상세 조회 API
 * GET /api/training-materials/[id]
 */
export async function GET(request, { params }) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // 먼저 training_material_media 테이블이 있는지 확인하기 위해 조인 쿼리 시도
    let { data: material, error } = await supabase
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
      .eq("id", id)
      .single();

    // training_material_media 테이블이 없거나 조인 실패 시, 기본 쿼리로 재시도
    if (error && (error.message?.includes("training_material_media") || error.code === "PGRST116")) {
      console.warn("training_material_media 테이블이 없어 기본 쿼리로 재시도합니다:", error.message);
      
      const result = await supabase
        .from("training_materials")
        .select("*")
        .eq("id", id)
        .single();
      
      material = result.data;
      error = result.error;
    }

    if (error || !material) {
      return NextResponse.json(
        { error: "교육 자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 관리자가 아닌 경우 발행된 것만 조회 가능
    if (user.role !== "ADMIN" && !material.is_published) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

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

    return NextResponse.json({
      material: {
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
      },
    });
  } catch (error) {
    console.error("Training material fetch error:", error);
    return NextResponse.json(
      { error: "교육 자료를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 교육 자료 수정 API
 * PUT /api/training-materials/[id]
 * ADMIN만 접근 가능
 */
export async function PUT(request, { params }) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, category, mediaItems, isPublished } = body;

    const supabase = await createClient();

    // 교육 자료 존재 확인
    const { data: existingMaterial, error: fetchError } = await supabase
      .from("training_materials")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingMaterial) {
      return NextResponse.json(
        { error: "교육 자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 구성
    const updateData = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (isPublished !== undefined) updateData.is_published = isPublished;

    // 교육 자료 기본 정보 업데이트
    const { data: material, error: updateError } = await supabase
      .from("training_materials")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update training material error:", updateError);
      return NextResponse.json(
        { error: updateError.message || "교육 자료 수정 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // mediaItems가 제공된 경우 미디어 항목 업데이트
    if (mediaItems !== undefined) {
      if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
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

      // 기존 미디어 항목 삭제
      const { error: deleteError } = await supabase
        .from("training_material_media")
        .delete()
        .eq("training_material_id", id);

      if (deleteError) {
        console.error("Delete training material media error:", deleteError);
        return NextResponse.json(
          { error: deleteError.message || "기존 미디어 삭제 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }

      // 새로운 미디어 항목들 생성
      const mediaToInsert = mediaItems.map((item, index) => ({
        training_material_id: id,
        media_type: item.mediaType,
        media_url: item.mediaUrl,
        display_order: item.displayOrder !== undefined ? item.displayOrder : index,
      }));

      const { error: insertError } = await supabase
        .from("training_material_media")
        .insert(mediaToInsert);

      if (insertError) {
        console.error("Insert training material media error:", insertError);
        return NextResponse.json(
          { error: insertError.message || "미디어 등록 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    // 업데이트된 미디어 항목들 조회
    const { data: updatedMedia, error: fetchMediaError } = await supabase
      .from("training_material_media")
      .select("*")
      .eq("training_material_id", id)
      .order("display_order", { ascending: true });

    const transformedMediaItems = (updatedMedia || []).map((m) => ({
      id: m.id,
      mediaType: m.media_type,
      mediaUrl: m.media_url,
      displayOrder: m.display_order,
    }));

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Training material update error:", error);
    return NextResponse.json(
      { error: "교육 자료 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 교육 자료 삭제 API
 * DELETE /api/training-materials/[id]
 * ADMIN만 접근 가능
 */
export async function DELETE(request, { params }) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // 교육 자료 존재 확인
    const { data: existingMaterial, error: fetchError } = await supabase
      .from("training_materials")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingMaterial) {
      return NextResponse.json(
        { error: "교육 자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("training_materials").delete().eq("id", id);

    if (error) {
      console.error("Delete training material error:", error);
      return NextResponse.json(
        { error: error.message || "교육 자료 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "교육 자료가 삭제되었습니다." });
  } catch (error) {
    console.error("Training material delete error:", error);
    return NextResponse.json(
      { error: "교육 자료 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

