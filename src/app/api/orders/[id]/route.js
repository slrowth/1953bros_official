import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { resolveStoreForUser, STATUS_MAP } from "../route";

/**
 * 주문 상세 조회 API
 * GET /api/orders/[id]
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
    const { id } = await params;

    // 관리자가 아닌 경우 자신의 매장 주문만 조회
    let query = supabase
      .from("orders")
      .select(
        `
          *,
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
              sku,
              uom
            )
          )
        `
      )
      .eq("id", id)
      .single();

    if (user.role !== "ADMIN") {
      const { store, errorResponse } = await resolveStoreForUser(supabase, user.id);
      if (errorResponse) {
        return errorResponse;
      }
      query = query.eq("store_id", store.id);
    }

    const { data: order, error } = await query;

    if (error || !order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const statusInfo = STATUS_MAP[order.status] || {
      label: order.status,
      tone: "info",
    };

    return NextResponse.json({
      order: {
        id: order.id,
        orderCode: order.order_code,
        status: order.status,
        statusLabel: statusInfo.label,
        statusTone: statusInfo.tone,
        paymentStatus: order.payment_status,
        totalAmount: parseFloat(order.total_amount),
        vatAmount: parseFloat(order.vat_amount),
        discountAmount: parseFloat(order.discount_amount),
        currency: order.currency,
        shippingAddress: order.shipping_address,
        shippingMethod: order.shipping_method,
        deliveryDate: order.delivery_date,
        placedAt: order.placed_at,
        processedAt: order.processed_at,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        cancelledAt: order.cancelled_at,
        store: {
          id: order.store.id,
          name: order.store.name,
          franchiseId: order.store.franchise_id,
          franchiseName: order.store.franchise?.name,
        },
        items: (order.order_items || []).map((item) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product?.name || "제품",
          productSku: item.product?.sku || "",
          productUom: item.product?.uom || "",
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          status: item.status,
        })),
      },
    });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { error: "주문 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 주문 상태 변경 API
 * PUT /api/orders/[id]
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

    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus, deliveryDate } = body;

    // 주문 존재 확인
    const { data: existingOrder, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상태 변경 유효성 검사
    const validStatuses = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "유효하지 않은 주문 상태입니다." },
        { status: 400 }
      );
    }

    const validPaymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: "유효하지 않은 결제 상태입니다." },
        { status: 400 }
      );
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      // 상태에 따른 타임스탬프 업데이트
      const now = new Date().toISOString();
      if (status === "PROCESSING" && !existingOrder.processed_at) {
        updateData.processed_at = now;
      } else if (status === "SHIPPED" && !existingOrder.shipped_at) {
        updateData.shipped_at = now;
      } else if (status === "DELIVERED" && !existingOrder.delivered_at) {
        updateData.delivered_at = now;
      } else if (status === "CANCELLED" && !existingOrder.cancelled_at) {
        updateData.cancelled_at = now;
        // 주문 취소 시 주문 품목도 취소
        await supabase
          .from("order_items")
          .update({ status: "CANCELLED" })
          .eq("order_id", id);
      }
    }

    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    if (deliveryDate !== undefined) {
      updateData.delivery_date = deliveryDate || null;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Order update error:", updateError);
      return NextResponse.json(
        { error: "주문 상태 변경 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.payment_status,
        deliveryDate: updatedOrder.delivery_date,
      },
    });
  } catch (error) {
    console.error("Update order API error:", error);
    return NextResponse.json(
      { error: "주문 상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { store, errorResponse } = await resolveStoreForUser(supabase, user.id);

    if (errorResponse) {
      return errorResponse;
    }

    const { id: orderId } = await params;

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, store_id")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError) {
      console.error("Order fetch error:", fetchError);
      return NextResponse.json(
        { error: "주문 정보를 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!order || order.store_id !== store.id) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (order.status !== "NEW") {
      return NextResponse.json(
        { error: "입금대기 상태의 주문만 취소할 수 있습니다." },
        { status: 400 }
      );
    }

    const cancelledAt = new Date().toISOString();

    const { error: cancelError } = await supabase
      .from("orders")
      .update({
        status: "CANCELLED",
        cancelled_at: cancelledAt,
        updated_at: cancelledAt,
      })
      .eq("id", orderId);

    if (cancelError) {
      console.error("Order cancel error:", cancelError);
      return NextResponse.json(
        { error: "주문 취소 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const { error: cancelItemsError } = await supabase
      .from("order_items")
      .update({
        status: "CANCELLED",
      })
      .eq("order_id", orderId);

    if (cancelItemsError) {
      console.error("Order items cancel error:", cancelItemsError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel order API error:", error);
    return NextResponse.json(
      { error: "주문 취소 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


