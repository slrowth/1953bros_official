import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 사용자 목록 조회 API
 * GET /api/users
 * ADMIN만 접근 가능
 */
export async function GET(request) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("users")
      .select(`
        *,
        franchise:franchises(
          id,
          name
        ),
        store:stores(
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    // 상태 필터 적용
    if (status) {
      query = query.eq("status", status);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("Fetch users error:", error);
      return NextResponse.json(
        { error: "사용자 목록을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 데이터 변환 (snake_case -> camelCase)
    const transformedUsers = (users || []).map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name: user.name,
      position: user.position,
      phone: user.phone,
      memo: user.memo,
      storeName: user.store_name,
      franchiseId: user.franchise_id,
      storeId: user.store_id,
      franchise: user.franchise
        ? {
            id: user.franchise.id,
            name: user.franchise.name,
          }
        : null,
      store: user.store
        ? {
            id: user.store.id,
            name: user.store.name,
          }
        : null,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json(
      { error: "사용자 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

