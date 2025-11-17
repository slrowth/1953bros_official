import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 체크리스트 상세 조회, 수정, 삭제 API
 * GET /api/quality/checklists/[id] - 상세 조회 (인증된 사용자 모두)
 * PUT /api/quality/checklists/[id] - 수정 (관리자만)
 * DELETE /api/quality/checklists/[id] - 삭제 (관리자만)
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

    // Next.js 15+에서 params가 Promise일 수 있음
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const supabase = await createClient();

    // 사용자 역할 확인
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.role === "ADMIN";

    // 체크리스트 조회
    let query = supabase
      .from("quality_checklists")
      .select("*")
      .eq("id", id);

    // 일반 사용자는 활성 체크리스트만 조회 가능
    if (!isAdmin) {
      query = query.eq("is_active", true);
    }

    const { data: checklist, error: checklistError } = await query.single();

    if (checklistError) {
      if (checklistError.code === "PGRST116") {
        return NextResponse.json(
          { error: "체크리스트를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      throw checklistError;
    }

    // 항목 조회
    const { data: items, error: itemsError } = await supabase
      .from("quality_items")
      .select("*")
      .eq("checklist_id", id)
      .order("order", { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    return NextResponse.json({
      checklist: {
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
      },
    });
  } catch (error) {
    console.error("Checklist fetch error:", error);
    return NextResponse.json(
      { error: "체크리스트를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // Next.js 15+에서 params가 Promise일 수 있음
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { title, description, items, isActive } = body;

    if (!title || !items || items.length === 0) {
      return NextResponse.json(
        { error: "제목과 항목은 필수입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 기존 체크리스트 조회
    const { data: existingChecklist, error: fetchError } = await supabase
      .from("quality_checklists")
      .select("version")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "체크리스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 체크리스트 업데이트 (버전 증가)
    const { error: updateError } = await supabase
      .from("quality_checklists")
      .update({
        title,
        description: description || null,
        version: existingChecklist.version + 1,
        is_active: isActive !== undefined ? isActive : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // 기존 항목 삭제
    const { error: deleteError } = await supabase
      .from("quality_items")
      .delete()
      .eq("checklist_id", id);

    if (deleteError) {
      throw deleteError;
    }

    // 새 항목 추가
    const itemsToInsert = items.map((item, index) => ({
      checklist_id: id,
      label: item.label,
      order: item.order !== undefined ? item.order : index,
    }));

    const { error: insertError } = await supabase
      .from("quality_items")
      .insert(itemsToInsert);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Checklist update error:", error);
    return NextResponse.json(
      { error: error.message || "체크리스트 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // Next.js 15+에서 params가 Promise일 수 있음
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const supabase = await createClient();

    // 체크리스트 삭제 (CASCADE로 항목도 함께 삭제됨)
    const { error } = await supabase
      .from("quality_checklists")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Checklist delete error:", error);
    return NextResponse.json(
      { error: error.message || "체크리스트 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}

