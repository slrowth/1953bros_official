import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 점검 기록 조회 및 생성 API
 * GET /api/quality/records - 점검 기록 조회 (관리자는 모든 기록, 일반 사용자는 본인 기록만)
 * POST /api/quality/records - 점검 기록 생성
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
    const date = searchParams.get("date");
    const storeId = searchParams.get("storeId");
    const checklistId = searchParams.get("checklistId");

    // 사용자 역할 확인
    const { data: userData } = await supabase
      .from("users")
      .select("role, store_id, franchise_id")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.role === "ADMIN";

    // 점검 기록 조회
    let query = supabase
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
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // 관리자가 아니면 본인의 기록만 조회
    if (!isAdmin) {
      if (userData?.store_id) {
        query = query.eq("store_id", userData.store_id);
      } else if (userData?.franchise_id) {
        query = query.eq("franchise_id", userData.franchise_id);
      } else {
        return NextResponse.json({ records: [] });
      }
    }

    // 필터 적용
    if (date) {
      query = query.eq("date", date);
    }
    if (storeId) {
      query = query.eq("store_id", storeId);
    }
    if (checklistId) {
      query = query.eq("checklist_id", checklistId);
    }

    const { data: records, error: recordsError } = await query;

    if (recordsError) {
      throw recordsError;
    }

    // 각 기록의 항목 조회
    const recordsWithItems = await Promise.all(
      (records || []).map(async (record) => {
        const { data: recordItems } = await supabase
          .from("quality_record_items")
          .select(
            `
            *,
            item:quality_items(id, label, order)
            `
          )
          .eq("record_id", record.id)
          .order("created_at", { ascending: true });

        return {
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
        };
      })
    );

    return NextResponse.json({ records: recordsWithItems });
  } catch (error) {
    console.error("Records fetch error:", error);
    return NextResponse.json(
      { error: "점검 기록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { checklistId, checklistVersion, date, items, notes } = body;

    if (!checklistId || !date || !items || items.length === 0) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, store_id, franchise_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 체크리스트 확인
    const { data: checklist, error: checklistError } = await supabase
      .from("quality_checklists")
      .select("id, version, is_active")
      .eq("id", checklistId)
      .single();

    if (checklistError || !checklist) {
      return NextResponse.json(
        { error: "체크리스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!checklist.is_active) {
      return NextResponse.json(
        { error: "비활성화된 체크리스트입니다." },
        { status: 400 }
      );
    }

    // 점검 기록 생성
    const { data: record, error: recordError } = await supabase
      .from("quality_records")
      .insert({
        checklist_id: checklistId,
        checklist_version: checklistVersion || checklist.version,
        franchise_id: userData.franchise_id,
        store_id: userData.store_id,
        date: date,
        completed_by_id: user.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (recordError) {
      throw recordError;
    }

    // 점검 기록 항목 생성
    const recordItems = items.map((item) => ({
      record_id: record.id,
      item_id: item.itemId,
      status: item.status || "N/A",
      comment: item.comment || null,
    }));

    const { error: itemsError } = await supabase
      .from("quality_record_items")
      .insert(recordItems);

    if (itemsError) {
      // 롤백: 기록 삭제
      await supabase.from("quality_records").delete().eq("id", record.id);
      throw itemsError;
    }

    return NextResponse.json(
      {
        record: {
          id: record.id,
          checklistId: record.checklist_id,
          date: record.date,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Record create error:", error);
    return NextResponse.json(
      { error: error.message || "점검 기록 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
