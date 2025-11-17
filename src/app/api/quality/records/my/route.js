import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 현재 사용자의 점검 기록 조회 API
 * GET /api/quality/records/my
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

    // 사용자의 매장 또는 프랜차이즈에 해당하는 점검 기록 조회
    let query = supabase
      .from("quality_records")
      .select(
        `
        *,
        checklist:quality_checklists(id, title, version),
        franchise:franchises(id, name),
        store:stores(id, name)
        `
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // store_id가 있으면 해당 매장의 기록만, 없으면 franchise_id로 필터링
    if (userData.store_id) {
      query = query.eq("store_id", userData.store_id);
    } else if (userData.franchise_id) {
      query = query.eq("franchise_id", userData.franchise_id).is("store_id", null);
    } else {
      // 매장 정보가 없으면 빈 배열 반환
      return NextResponse.json({ records: [] });
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
    console.error("My records fetch error:", error);
    return NextResponse.json(
      { error: "점검 기록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

