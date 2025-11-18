"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

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
  console.log(`[ECOUNT] 주문 ${orderId} 전송 시작`);
  try {
    // RLS를 우회하기 위해 서비스 역할 클라이언트 사용
    const adminSupabase = createAdminClient();
    const supabase = await createClient();

    // 서버 사이드에서 RLS를 우회하여 조회 (서비스 역할 사용)
    const { data: keyRecord, error: keyError } = await adminSupabase
      .from("integration_keys")
      .select("*")
      .eq("service", "ECOUNT")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (keyError) {
      console.error("[ECOUNT] ❌ API 키 조회 오류:", JSON.stringify(keyError, null, 2));
      console.error("[ECOUNT] 오류 상세:", keyError.message, keyError.code, keyError.details);
      return;
    }

    if (!keyRecord) {
      console.warn("[ECOUNT] ⚠️ 활성화된 API 키가 등록되지 않았습니다. 관리자 페이지(/admin/integrations/api-keys)에서 API 키를 등록하고 활성화해주세요.");
      return;
    }

    console.log(`[ECOUNT] API 키 발견: ${keyRecord.label}, ZONE: ${keyRecord.zone || "없음"}`);

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
    const apiCertKey = keyRecord.api_key || ""; // API_CERT_KEY
    const userId = keyRecord.session_id || ""; // USER_ID
    const comCode = keyRecord.config?.com_code || ""; // COM_CODE (config에서 가져오거나 기본값 사용)

    console.log(`[ECOUNT] 키 정보 확인:`, {
      zone: zone || "없음",
      apiCertKey: apiCertKey ? `${apiCertKey.substring(0, 5)}...` : "없음",
      userId: userId || "없음",
      comCode: comCode || "없음",
    });

    // ZONE 검증
    if (!zone || zone.trim() === "") {
      console.error("[ECOUNT] ❌ ZONE이 설정되지 않았습니다. API 키 관리 페이지에서 ZONE을 입력해주세요. (예: CB, B, D, C 등)");
      return;
    }

    if (!apiCertKey || apiCertKey.trim() === "") {
      console.error("[ECOUNT] ❌ API_CERT_KEY가 설정되지 않았습니다.");
      return;
    }

    if (!userId || userId.trim() === "") {
      console.error("[ECOUNT] ❌ USER_ID가 설정되지 않았습니다.");
      console.error("[ECOUNT] ⚠️ '별도 SESSION ID' 필드에 USER_ID를 입력해주세요.");
      return;
    }

    // COM_CODE가 없으면 기본값 사용 (또는 에러 처리)
    if (!comCode || comCode.trim() === "") {
      console.warn("[ECOUNT] ⚠️ COM_CODE가 설정되지 않았습니다. 기본값을 사용합니다.");
    }

    console.log(`[ECOUNT] 인증 정보: ZONE=${zone}, API_CERT_KEY=${apiCertKey ? "있음" : "없음"}, USER_ID=${userId ? "있음" : "없음"}, COM_CODE=${comCode || "기본값"}`);

    // 1단계: 로그인 API 호출하여 SESSION_ID 받기
    // 이카운트 로그인 API: https://oapi{ZONE}.ecount.com/OAPI/V2/OAPILogin
    const loginEndpoint = `https://oapi${zone}.ecount.com/OAPI/V2/OAPILogin`;
    console.log(`[ECOUNT] 로그인 API 호출: ${loginEndpoint}`);

    let sessionId;
    try {
      // 이카운트 로그인 API Request Body 형식
      const loginRequestBody = {
        COM_CODE: comCode || "80001", // 기본값 또는 config에서 가져온 값
        USER_ID: userId,
        API_CERT_KEY: apiCertKey,
        LAN_TYPE: "ko-KR", // 한국어
        ZONE: zone,
      };

      console.log(`[ECOUNT] 로그인 요청 데이터:`, {
        ...loginRequestBody,
        API_CERT_KEY: "***",
      });

      const loginResponse = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginRequestBody),
      });

      const loginResult = await loginResponse.json();
      console.log(`[ECOUNT] 로그인 응답:`, JSON.stringify(loginResult, null, 2));

      if (loginResult?.Status === "200" && loginResult?.Data?.SESSION_ID) {
        sessionId = loginResult.Data.SESSION_ID;
        console.log(`[ECOUNT] ✅ 로그인 성공, SESSION_ID 획득: ${sessionId.substring(0, 10)}...`);
      } else {
        const errorMsg = loginResult?.Error?.Message || loginResult?.Errors?.[0]?.Message || "로그인 실패";
        console.error(`[ECOUNT] ❌ 로그인 실패:`, errorMsg);
        console.error(`[ECOUNT] 로그인 응답 전체:`, JSON.stringify(loginResult, null, 2));
        return;
      }
    } catch (loginError) {
      console.error("[ECOUNT] ❌ 로그인 API 호출 오류:", loginError.message);
      return;
    }

    // 2단계: 받은 SESSION_ID로 주문 API 호출
    const endpoint = `https://oapi${zone}.ecount.com/OAPI/V2/SaleOrder/SaveSaleOrder?SESSION_ID=${sessionId}`;

    console.log(`[ECOUNT] 전송 URL: ${endpoint.replace(sessionId, "***")}`);
    console.log(`[ECOUNT] 전송 데이터:`, JSON.stringify({ SaleOrderList: saleOrderList }, null, 2));

    try {
      console.log(`[ECOUNT] API 호출 시작: ${endpoint.replace(sessionId, "***")}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ SaleOrderList: saleOrderList }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[ECOUNT] 응답 상태: ${response.status} ${response.statusText}`);

      const responseText = await response.text();
      console.log(`[ECOUNT] 응답 본문 (원본):`, responseText);

      if (!response.ok) {
        console.error("[ECOUNT] ❌ API 호출 실패:", response.status, responseText);
        return;
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[ECOUNT] ❌ 응답 JSON 파싱 실패:", parseError, "원본:", responseText);
        return;
      }

      console.log(`[ECOUNT] 응답 데이터 (파싱됨):`, JSON.stringify(result, null, 2));
      
      // 이카운트 API 응답 처리
      if (result?.Status === "500" || result?.Errors?.length > 0) {
        const errorCode = result?.Errors?.[0]?.Code || result?.Error?.Code;
        const errorMessage = result?.Errors?.[0]?.Message || result?.Error?.Message || "알 수 없는 오류";
        
        if (errorCode === "EXP00001" || errorMessage.includes("login") || errorMessage.includes("Please login")) {
          console.error("[ECOUNT] ❌ 인증 오류: SESSION_ID가 유효하지 않거나 만료되었습니다.");
          console.error("[ECOUNT] 해결 방법:");
          console.error("  1. 이카운트에서 새로운 SESSION_ID를 발급받아 등록하세요.");
          console.error("  2. 또는 API_KEY를 사용하는 경우, 이카운트에서 API_KEY가 SESSION_ID로 사용 가능한지 확인하세요.");
          console.error("  3. 이카운트 로그인 API를 먼저 호출하여 SESSION_ID를 받아야 할 수 있습니다.");
        } else {
          console.error("[ECOUNT] ❌ ERP 전송 실패:", errorMessage, "Code:", errorCode);
        }
        console.error("[ECOUNT] 전체 응답:", JSON.stringify(result, null, 2));
      } else if (result?.Data?.FailCnt > 0) {
        console.error("[ECOUNT] ❌ ERP 전송 실패:", JSON.stringify(result?.Data?.ResultDetails || []));
        console.error("[ECOUNT] 실패 상세:", result?.Data);
      } else if (result?.Data?.SuccessCnt > 0) {
        console.log("[ECOUNT] ✅ ERP 전송 성공! SlipNos:", result?.Data?.SlipNos);
        console.log("[ECOUNT] 성공 상세:", result?.Data);
      } else {
        console.warn("[ECOUNT] ⚠️ 응답에 성공/실패 정보가 없습니다:", result);
      }
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error("[ECOUNT] ❌ 요청 타임아웃 (30초 초과)");
      } else if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'EAI_AGAIN') {
        console.error("[ECOUNT] ❌ DNS 해석 실패 - URL을 확인해주세요:", endpoint.replace(sessionId, "***"));
      } else if (fetchError.code === 'ECONNREFUSED') {
        console.error("[ECOUNT] ❌ 연결 거부됨 - 이카운트 서버에 연결할 수 없습니다");
      } else if (fetchError.code === 'ETIMEDOUT') {
        console.error("[ECOUNT] ❌ 연결 타임아웃 - 이카운트 서버 응답이 없습니다");
      } else {
        console.error("[ECOUNT] ❌ 네트워크 오류:", {
          message: fetchError.message,
          code: fetchError.code,
          cause: fetchError.cause,
          stack: fetchError.stack
        });
      }
      console.error("[ECOUNT] 전송 시도한 URL:", endpoint.replace(sessionId, "***"));
    }
  } catch (error) {
    console.error("[ECOUNT] ❌ ERP 연동 오류:", error.message, error.stack);
  }
}

