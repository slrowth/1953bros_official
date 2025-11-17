import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 점검 기록 상세 조회 및 수정 API
 * GET /api/quality/records/[id] - 상세 조회 (관리자 또는 본인)
 * PUT /api/quality/records/[id] - 수정 (본인만)
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

    // 관리자 권한 확인
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.role === "ADMIN";

    // 점검 기록 조회
    const { data: record, error: recordError } = await supabase
      .from("quality_records")
      .select(
        `
        *,
        checklist:quality_checklists(id, title, version),
        franchise:franchises(id, name),
        store:stores(id, name),
        completed_by:users!quality_records_completed_by_id_fkey(id, email)
        `
      )
      .eq("id", id)
      .single();

    if (recordError) {
      if (recordError.code === "PGRST116") {
        return NextResponse.json(
          { error: "점검 기록을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      throw recordError;
    }

    // 관리자가 아니면 본인의 기록만 조회 가능
    if (!isAdmin && record.completed_by_id !== user.id) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // 점검 기록 항목 조회
    const { data: recordItems, error: itemsError } = await supabase
      .from("quality_record_items")
      .select(
        `
        *,
        item:quality_items(id, label, order)
        `
      )
      .eq("record_id", id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    return NextResponse.json({
      record: {
        id: record.id,
        checklistId: record.checklist_id,
        checklistVersion: record.checklist_version,
        franchiseId: record.franchise_id,
        storeId: record.store_id,
        date: record.date,
        completedById: record.completed_by_id,
        notes: record.notes,
        createdAt: record.created_at,
        checklist: record.checklist
          ? {
              id: record.checklist.id,
              title: record.checklist.title,
              version: record.checklist.version,
            }
          : null,
        franchise: record.franchise
          ? {
              id: record.franchise.id,
              name: record.franchise.name,
            }
          : null,
        store: record.store
          ? {
              id: record.store.id,
              name: record.store.name,
            }
          : null,
        completedBy: record.completed_by
          ? {
              id: record.completed_by.id,
              email: record.completed_by.email,
            }
          : null,
        items: (recordItems || []).map((ri) => ({
          id: ri.id,
          itemId: ri.item_id,
          status: ri.status,
          comment: ri.comment,
          item: ri.item
            ? {
                id: ri.item.id,
                label: ri.item.label,
                order: ri.item.order,
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error("Record fetch error:", error);
    return NextResponse.json(
      { error: "점검 기록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { items, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "점검 항목이 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 기존 기록 조회
    const { data: record, error: recordError } = await supabase
      .from("quality_records")
      .select("id, completed_by_id")
      .eq("id", id)
      .single();

    if (recordError) {
      if (recordError.code === "PGRST116") {
        return NextResponse.json(
          { error: "점검 기록을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      throw recordError;
    }

    // 본인의 기록만 수정 가능
    if (record.completed_by_id !== user.id) {
      return NextResponse.json(
        { error: "본인의 점검 기록만 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    // 기록 업데이트
    const { error: updateError } = await supabase
      .from("quality_records")
      .update({
        notes: notes || null,
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // 기존 항목 삭제
    const { error: deleteError } = await supabase
      .from("quality_record_items")
      .delete()
      .eq("record_id", id);

    if (deleteError) {
      throw deleteError;
    }

    // 새 항목 추가
    const recordItems = items.map((item) => ({
      record_id: id,
      item_id: item.itemId,
      status: item.status || "N/A",
      comment: item.comment || null,
    }));

    const { error: insertError } = await supabase
      .from("quality_record_items")
      .insert(recordItems);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Record update error:", error);
    return NextResponse.json(
      { error: error.message || "점검 기록 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

