"use server";

import { createClient } from "@/lib/supabase/server";

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function sendOrderToEcount(orderId) {
  try {
    const supabase = await createClient();

    const { data: keyRecord, error: keyError } = await supabase
      .from("integration_keys")
      .select("*")
      .eq("service", "ECOUNT")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (keyError || !keyRecord) {
      console.warn("[ECOUNT] API key가 설정되지 않았습니다.");
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
          id,
          placed_at,
          delivery_date,
          store:stores(
            id,
            name,
            code,
            franchise_id,
            franchise:franchises(name)
          ),
          order_items(
            id,
            quantity,
            unit_price,
            product:products(
              id,
              name,
              sku
            )
          )
        `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("[ECOUNT] 주문을 찾을 수 없습니다.", orderError);
      return;
    }

    if (!order.store?.code) {
      console.warn("[ECOUNT] 매장 코드가 없어 ERP 전송을 건너뜁니다.");
      return;
    }

    const ioDate = formatDate(order.placed_at) || formatDate(new Date());

    const saleOrderList = (order.order_items || []).map((item, index) => ({
      BulkDatas: {
        IO_DATE: ioDate,
        UPLOAD_SER_NO: "",
        CUST: order.store.code,
        CUST_DES: order.store.name,
        PROD_CD: item.product?.sku || "",
        PROD_DES: item.product?.name || "",
        QTY: String(item.quantity || ""),
        PRICE: String(item.unit_price || ""),
        REMARKS: `Order# ${order.id}`,
        ADD_TXT_01: order.store.franchise?.name || "",
        ADD_TXT_02: order.delivery_date || "",
        ADD_TXT_03: keyRecord.label || "",
        ITEM_CD: item.product?.id || "",
        ADD_NUM_01: String(index + 1),
      },
    }));

    if (saleOrderList.length === 0) {
      console.warn("[ECOUNT] 주문 품목이 없어 ERP 전송을 건너뜁니다.");
      return;
    }

    const zone = keyRecord.zone || "";
    const sessionId = keyRecord.session_id || keyRecord.api_key;
    const endpoint = `https://oapi${zone}.ecount.com/OAPI/V2/SaleOrder/SaveSaleOrder?SESSION_ID=${sessionId}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ SaleOrderList: saleOrderList }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[ECOUNT] API 호출 실패:", text);
      return;
    }

    const result = await response.json();
    if (result?.Data?.FailCnt > 0) {
      console.error("[ECOUNT] ERP 전송 실패:", JSON.stringify(result?.Data?.ResultDetails || []));
    } else {
      console.log("[ECOUNT] ERP 전송 성공", result?.Data?.SlipNos);
    }
  } catch (error) {
    console.error("[ECOUNT] ERP 연동 오류:", error);
  }
}

