import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 매장 목록 조회 API
 * GET /api/stores
 * 관리자는 모든 매장 조회 가능
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
    const franchiseId = searchParams.get("franchiseId");
    const isActive = searchParams.get("isActive");

    let query = supabase
      .from("stores")
      .select(
        `
          *,
          franchise:franchises!inner(
            id,
            name,
            code
          )
        `
      )
      .order("name", { ascending: true });

    if (franchiseId) {
      query = query.eq("franchise_id", franchiseId);
    }

    if (isActive === "true") {
      query = query.eq("is_active", true);
    }

    const { data: stores, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ stores: stores || [] });
  } catch (error) {
    console.error("Stores fetch error:", error);
    return NextResponse.json(
      { error: "매장 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

