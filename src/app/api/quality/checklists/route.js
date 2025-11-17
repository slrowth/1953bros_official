import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 체크리스트 목록 조회 및 생성 API
 * GET /api/quality/checklists - 목록 조회 (인증된 사용자 모두)
 * POST /api/quality/checklists - 체크리스트 생성 (관리자만)
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

    // 사용자 역할 확인
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.role === "ADMIN";

    // 체크리스트 목록 조회
    let query = supabase
      .from("quality_checklists")
      .select("*")
      .order("created_at", { ascending: false });

    // 일반 사용자는 활성 체크리스트만 조회
    if (!isAdmin) {
      query = query.eq("is_active", true);
    }

    const { data: checklists, error: checklistsError } = await query;

    if (checklistsError) {
      throw checklistsError;
    }

    // 각 체크리스트의 항목 조회
    const checklistsWithItems = await Promise.all(
      (checklists || []).map(async (checklist) => {
        const { data: items } = await supabase
          .from("quality_items")
          .select("*")
          .eq("checklist_id", checklist.id)
          .order("order", { ascending: true });

        return {
          id: checklist.id,
          title: checklist.title,
          description: checklist.description,
          version: checklist.version,
          isActive: checklist.is_active,
          items: (items || []).map((item) => ({
            id: item.id,
            label: item.label,
            order: item.order,
          })),
          createdAt: checklist.created_at,
          updatedAt: checklist.updated_at,
        };
      })
    );

    return NextResponse.json({ checklists: checklistsWithItems });
  } catch (error) {
    console.error("Checklists fetch error:", error);
    return NextResponse.json(
      { error: "체크리스트 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

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
    const { title, description, items } = body;

    if (!title || !items || items.length === 0) {
      return NextResponse.json(
        { error: "제목과 항목은 필수입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 체크리스트 생성
    const { data: checklist, error: checklistError } = await supabase
      .from("quality_checklists")
      .insert({
        title,
        description: description || null,
        version: 1,
        is_active: true,
      })
      .select()
      .single();

    if (checklistError) {
      throw checklistError;
    }

    // 체크리스트 항목 생성
    const itemsToInsert = items.map((item, index) => ({
      checklist_id: checklist.id,
      label: item.label,
      order: item.order !== undefined ? item.order : index,
    }));

    const { error: itemsError } = await supabase
      .from("quality_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // 롤백: 체크리스트 삭제
      await supabase.from("quality_checklists").delete().eq("id", checklist.id);
      throw itemsError;
    }

    return NextResponse.json(
      {
        checklist: {
          id: checklist.id,
          title: checklist.title,
          description: checklist.description,
          version: checklist.version,
          isActive: checklist.is_active,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checklist create error:", error);
    return NextResponse.json(
      { error: error.message || "체크리스트 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

