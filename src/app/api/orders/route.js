import { ORDER_STATUS_MAP } from "@/constants/orderStatus";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { sendOrderToEcount } from "@/lib/integrations/ecount";
import crypto from "crypto";

export const STATUS_MAP = ORDER_STATUS_MAP;

const ORDER_CODE_LENGTH = 10;
const ORDER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOrderCode() {
  const randomBytes = crypto.randomBytes(ORDER_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < ORDER_CODE_LENGTH; i += 1) {
    const index = randomBytes[i] % ORDER_CODE_CHARS.length;
    code += ORDER_CODE_CHARS[index];
  }
  return code;
}

async function generateUniqueOrderCode(supabase, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateOrderCode();
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("order_code", code)
      .limit(1)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }
  throw new Error("고유 주문번호 생성에 실패했습니다.");
}

export async function resolveStoreForUser(supabase, userId) {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("store_id, store_name")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    return {
      errorResponse: NextResponse.json(
        { error: "사용자 정보를 불러올 수 없습니다." },
        { status: 500 }
      ),
    };
  }

  if (userData.store_id) {
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("id, franchise_id, name")
      .eq("id", userData.store_id)
      .eq("is_active", true)
      .single();

    if (storeError) {
      console.error("Store lookup error:", storeError);
      return {
        errorResponse: NextResponse.json(
          { error: "매장 정보를 조회하는 중 오류가 발생했습니다." },
          { status: 500 }
        ),
      };
    }

    if (!storeData) {
      return {
        errorResponse: NextResponse.json(
          { error: "활성 매장을 찾을 수 없습니다. 관리자에게 문의하세요." },
          { status: 400 }
        ),
      };
    }

    return { store: storeData };
  }

  if (userData.store_name) {
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("id, franchise_id, name")
      .eq("name", userData.store_name)
      .eq("is_active", true)
      .maybeSingle();

    if (storeError) {
      console.error("Store lookup (by name) error:", storeError);
      return {
        errorResponse: NextResponse.json(
          { error: "매장 정보를 조회하는 중 오류가 발생했습니다." },
          { status: 500 }
        ),
      };
    }

    if (!storeData) {
      return {
        errorResponse: NextResponse.json(
          { error: "선택한 매장을 찾을 수 없습니다. 관리자에게 문의하세요." },
          { status: 400 }
        ),
      };
    }

    return { store: storeData };
  }

  return {
    errorResponse: NextResponse.json(
      { error: "해당 계정에 연결된 활성 매장이 없습니다. 관리자에게 문의하세요." },
      { status: 400 }
    ),
  };
}

function formatDate(date) {
  if (!date) {
    return "미정";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "미정";
  }
  return parsed.toISOString().slice(0, 10);
}

function formatDateTime(date) {
  if (!date) {
    return "미정";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "미정";
  }
  // 한국 시간대로 변환하여 포맷팅
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 주문 생성 API
 * POST /api/orders
 */
export async function POST(request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    const { items, shippingAddress, shippingMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "주문 품목이 필요합니다." },
        { status: 400 }
      );
    }

    const { store, errorResponse } = await resolveStoreForUser(supabase, user.id);
    if (errorResponse) {
      return errorResponse;
    }

    const storeId = store.id;
    const franchiseId = store.franchise_id;

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const { productId, quantity, unitPrice } = item;

      if (!productId || !quantity || quantity <= 0 || !unitPrice) {
        return NextResponse.json(
          { error: "주문 품목 정보가 올바르지 않습니다." },
          { status: 400 }
        );
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, price, tax_rate")
        .eq("id", productId)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: `제품을 찾을 수 없습니다: ${productId}` },
          { status: 404 }
        );
      }

      const itemTotal = parseFloat(unitPrice) * quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        product_id: productId,
        quantity,
        unit_price: parseFloat(unitPrice),
      });
    }

    const vatAmount = Math.round(totalAmount * 0.1);
    const finalTotalAmount = totalAmount + vatAmount;

    const orderCode = await generateUniqueOrderCode(supabase).catch((error) => {
      console.error("Order code generation error:", error);
      return null;
    });

    if (!orderCode) {
      return NextResponse.json(
        { error: "주문 번호 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: storeId,
        franchise_id: franchiseId,
        order_code: orderCode,
        status: "NEW",
        payment_status: "PENDING",
        total_amount: finalTotalAmount,
        vat_amount: vatAmount,
        discount_amount: 0,
        shipping_address: shippingAddress || "배송지 정보 없음",
        shipping_method: shippingMethod || null,
        placed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "주문 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const orderItemsWithOrderId = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
      status: "PENDING",
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsWithOrderId);

    if (orderItemsError) {
      console.error("Order items creation error:", orderItemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "주문 품목 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const responseBody = {
      success: true,
      order: {
        id: order.id,
        orderCode: order.order_code,
        totalAmount: finalTotalAmount,
        vatAmount,
        status: order.status,
        placedAt: order.placed_at,
      },
    };

    // 이카운트 ERP로 주문 전송 (비동기, 에러가 발생해도 주문 생성에는 영향 없음)
    console.log(`[ORDER] ✅ 주문 생성 완료: ${order.id}`);
    console.log(`[ORDER] 🚀 이카운트 전송 시작: ${order.id}`);
    sendOrderToEcount(order.id)
      .then(() => {
        console.log(`[ORDER] ✅ 이카운트 전송 완료: ${order.id}`);
      })
      .catch((error) => {
        console.error(`[ORDER] ❌ 이카운트 전송 중 예외 발생: ${order.id}`, error);
      });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Create order API error:", error);
    return NextResponse.json(
      { error: "주문 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 주문 내역 조회 API
 * GET /api/orders
 * 관리자는 모든 주문 조회 가능, 일반 사용자는 자신의 매장 주문만 조회
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
    const status = searchParams.get("status");
    const storeId = searchParams.get("storeId");
    const franchiseId = searchParams.get("franchiseId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("orders")
      .select(
        `
          id,
          order_code,
          status,
          payment_status,
          placed_at,
          delivery_date,
          total_amount,
          vat_amount,
          store:stores!inner(
            id,
            name,
            franchise_id,
            franchise:franchises!inner(
              id,
              name
            )
          ),
          order_items:order_items(
            id,
            product_id,
            quantity,
            unit_price,
            status,
            product:products(
              id,
              name,
              sku
            )
          )
        `
      )
      .order("placed_at", { ascending: false })
      .limit(limit);

    // 관리자가 아닌 경우 자신의 매장 주문만 조회
    if (user.role !== "ADMIN") {
      const { store, errorResponse } = await resolveStoreForUser(supabase, user.id);
      if (errorResponse) {
        return errorResponse;
      }
      query = query.eq("store_id", store.id);
    } else {
      // 관리자는 필터링 가능
      if (storeId) {
        query = query.eq("store_id", storeId);
      }
      if (franchiseId) {
        query = query.eq("store.franchise_id", franchiseId);
      }
    }

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    const { data: ordersData, error: ordersError } = await query;

    if (ordersError) {
      console.error("Fetch orders error:", ordersError);
      return NextResponse.json(
        { error: "주문 내역을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const orders = (ordersData || []).map((order) => {
      const statusInfo = STATUS_MAP[order.status] || {
        label: order.status,
        tone: "info",
      };

      const items = (order.order_items || []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product?.name || "제품",
        sku: item.product?.sku || "",
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        status: item.status,
      }));

      return {
        id: order.id,
        orderCode: order.order_code,
        orderedAt: formatDateTime(order.placed_at),
        deliveryDate: formatDate(order.delivery_date),
        status: statusInfo.label,
        statusTone: statusInfo.tone,
        statusCode: order.status,
        paymentStatus: order.payment_status,
        totalAmount: parseFloat(order.total_amount),
        vatAmount: parseFloat(order.vat_amount),
        store: {
          id: order.store.id,
          name: order.store.name,
          franchiseId: order.store.franchise_id,
          franchiseName: order.store.franchise?.name,
        },
        items,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch order history API error:", error);
    return NextResponse.json(
      { error: "주문 내역을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

