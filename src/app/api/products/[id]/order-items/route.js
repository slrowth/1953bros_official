import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 특정 제품의 최근 주문 내역 조회 API
 * GET /api/products/[id]/order-items
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

    const supabase = await createClient();
    const { id: productId } = await params;

    // order_items에서 해당 제품의 최근 주문 내역 조회
    // store 기준으로 필터링
    const { data: userData } = await supabase
      .from("users")
      .select("store_id")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("order_items")
      .select(`
        id,
        quantity,
        unit_price,
        status,
        created_at,
        order:orders!inner(
          id,
          status,
          placed_at,
          store_id,
          store:stores!inner(
            id,
            name,
            franchise_id,
            franchise:franchises!inner(
              name
            )
          )
        )
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(10); // 최근 10건만

    // 사용자가 OWNER/STAFF인 경우 자신의 매장 주문만 조회 (store 기준)
    if (user.role !== "ADMIN" && userData?.store_id) {
      query = query.eq("order.store_id", userData.store_id);
    }

    const { data: orderItems, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ orderItems: orderItems || [] });
  } catch (error) {
    console.error("Order items fetch error:", error);
    return NextResponse.json(
      { error: "주문 내역을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

