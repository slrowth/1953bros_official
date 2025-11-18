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

/**
 * 테스트 인증키로 검증 요청 전송
 * 이카운트에 테스트 데이터를 전송하여 검증을 받는 함수
 * @param {string} keyId - API 키 ID
 * @param {string} manualSessionId - 사용자가 직접 입력한 SESSION_ID (선택)
 */
export async function requestEcountVerification(keyId, manualSessionId = null) {
  console.log(`[ECOUNT] 검증 요청 시작 (Key ID: ${keyId})`);
  try {
    const adminSupabase = createAdminClient();

    // API 키 조회
    const { data: keyRecord, error: keyError } = await adminSupabase
      .from("integration_keys")
      .select("*")
      .eq("id", keyId)
      .eq("service", "ECOUNT")
      .single();

    if (keyError || !keyRecord) {
      console.error("[ECOUNT] ❌ API 키를 찾을 수 없습니다.");
      return { success: false, error: "API 키를 찾을 수 없습니다." };
    }

    const zone = keyRecord.zone || "";
    const apiCertKey = keyRecord.api_key || "";
    const userId = keyRecord.session_id || "";
    const comCode = keyRecord.config?.com_code || "";

    // 필수 값 검증
    if (!zone || !apiCertKey || !userId || !comCode) {
      return { success: false, error: "필수 정보가 누락되었습니다." };
    }

    // 1단계: 로그인 API 호출
    // 테스트 인증키 검증은 sboapi 도메인을 사용해야 함 (이카운트 문서 규정)
    const baseDomain = `https://sboapi${zone}.ecount.com`;
    const loginEndpoint = `${baseDomain}/OAPI/V2/OAPILogin`;
    console.log(`[ECOUNT] 검증용 로그인 API 호출: ${loginEndpoint}`);

    const loginRequestBody = {
      COM_CODE: comCode.trim(),
      USER_ID: userId,
      API_CERT_KEY: apiCertKey,
      LAN_TYPE: "ko-KR",
      ZONE: zone,
    };

    const loginResponse = await fetch(loginEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginRequestBody),
    });

    const loginResult = await loginResponse.json();
    console.log(`[ECOUNT] 검증용 로그인 응답:`, JSON.stringify(loginResult, null, 2));

    // Code 204(테스트 인증키)일 때도 SESSION_ID를 받을 수 있는지 확인
    const dataCode = loginResult?.Data?.Code;
    let sessionId = null;

    // 사용자가 직접 입력한 SESSION_ID가 있으면 우선 사용
    if (manualSessionId && manualSessionId.trim() !== "") {
      sessionId = manualSessionId.trim();
      console.log(`[ECOUNT] 💡 사용자가 직접 입력한 SESSION_ID 사용`);
    } else {
      // 응답 구조를 더 자세히 확인
      console.log(`[ECOUNT] 응답 구조 확인:`, {
        Status: loginResult?.Status,
        Data: loginResult?.Data,
        DataCode: loginResult?.Data?.Code,
        DataDatas: loginResult?.Data?.Datas,
        DataDatasSessionId: loginResult?.Data?.Datas?.SESSION_ID,
      });

      if (dataCode === "00") {
        // 정상 로그인
        sessionId = loginResult?.Data?.Datas?.SESSION_ID;
        console.log(`[ECOUNT] ✅ 로그인 성공, SESSION_ID 획득`);
      } else if (dataCode === "204") {
        // 테스트 인증키 - 여러 경로에서 SESSION_ID 확인
        sessionId = loginResult?.Data?.Datas?.SESSION_ID || 
                    loginResult?.Data?.SESSION_ID || 
                    loginResult?.SESSION_ID;
        
        if (sessionId) {
          console.log(`[ECOUNT] ⚠️ 테스트 인증키로 로그인 (Code: 204), SESSION_ID 획득`);
        } else {
          // SESSION_ID가 응답에 없으면 사용자 입력 요청
          console.warn(`[ECOUNT] ⚠️ 테스트 인증키로 로그인 (Code: 204), 응답에 SESSION_ID 없음`);
          return {
            success: false,
            error: "테스트 인증키 응답에 SESSION_ID가 없습니다. 직접 SESSION_ID를 입력하여 검증 요청을 보낼 수 있습니다.",
            requiresSessionId: true,
          };
        }
      } else {
        const errorMsg = loginResult?.Data?.Message || "로그인 실패";
        return { success: false, error: `로그인 실패 (Code: ${dataCode}): ${errorMsg}` };
      }
    }

    if (!sessionId) {
      return { success: false, error: "SESSION_ID를 받을 수 없습니다." };
    }

    // 2단계: 검증용 테스트 주문 데이터 전송
    // Products 테이블에서 실제 sku를 가져와서 사용
    const supabase = await createClient();
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("sku, name")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (productsError || !products) {
      return {
        success: false,
        error: "검증용 상품을 찾을 수 없습니다. 활성화된 상품이 최소 1개 이상 필요합니다.",
      };
    }

    const today = formatDate(new Date());
    const testSaleOrderList = [
      {
        BulkDatas: {
          IO_DATE: today,
          UPLOAD_SER_NO: "",
          CUST: "00001", // 테스트 거래처 코드
          CUST_DES: "검증용 테스트 거래처",
          WH_CD: "00001", // 출하창고 코드 (통일)
          PROD_CD: products.sku, // Products 테이블의 sku 사용
          PROD_DES: products.name || "검증용 테스트 품목",
          QTY: "1",
          PRICE: "1000",
          REMARKS: "이카운트 API 검증 요청용 테스트 주문",
          ADD_TXT_01: "VERIFICATION_REQUEST",
          ADD_TXT_02: `검증 요청 시간: ${new Date().toISOString()}`,
        },
      },
    ];

    const endpoint = `${baseDomain}/OAPI/V2/SaleOrder/SaveSaleOrder?SESSION_ID=${sessionId}`;
    console.log(`[ECOUNT] 검증용 주문 API 호출: ${endpoint.replace(sessionId, "***")}`);
    console.log(`[ECOUNT] 검증용 전송 데이터:`, JSON.stringify({ SaleOrderList: testSaleOrderList }, null, 2));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ SaleOrderList: testSaleOrderList }),
    });

    const responseText = await response.text();
    console.log(`[ECOUNT] 검증용 응답 (원본):`, responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      return { success: false, error: `응답 파싱 실패: ${responseText}` };
    }

    console.log(`[ECOUNT] 검증용 응답 데이터:`, JSON.stringify(result, null, 2));

    // 응답 분석
    if (result?.Status === "500" || result?.Errors?.length > 0) {
      const errorMessage = result?.Errors?.[0]?.Message || result?.Error?.Message || "알 수 없는 오류";
      return {
        success: false,
        error: `검증 요청 실패: ${errorMessage}`,
        details: result,
      };
    }

    // 성공 또는 부분 성공
    if (result?.Data?.SuccessCnt > 0 || result?.Status === "200") {
      return {
        success: true,
        message: "검증 요청이 성공적으로 전송되었습니다. 이카운트에서 확인 후 운영 인증키를 발급받으세요.",
        details: result,
      };
    }

    // 기타 응답
    return {
      success: true,
      message: "검증 요청이 전송되었습니다. 이카운트에서 확인 후 운영 인증키를 발급받으세요.",
      details: result,
    };
  } catch (error) {
    console.error("[ECOUNT] ❌ 검증 요청 오류:", error.message);
    return { success: false, error: `검증 요청 중 오류 발생: ${error.message}` };
  }
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
        WH_CD: "00001", // 출하창고 코드 (통일)
        PROD_CD: item.product?.sku || "", // Products 테이블의 sku 사용
        PROD_DES: item.product?.name || "",
        QTY: String(item.quantity || ""),
        PRICE: String(item.unit_price || ""),
        REMARKS: `Order# ${order.id}`,
        ADD_TXT_01: order.id, // 플랫폼 주문번호
        ADD_TXT_02: order.delivery_date || "",
        ADD_TXT_03: keyRecord.label || "",
        ITEM_CD: "",
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
      zoneLength: zone?.length || 0,
      apiCertKey: apiCertKey ? `${apiCertKey.substring(0, 5)}...` : "없음",
      apiCertKeyLength: apiCertKey?.length || 0,
      userId: userId || "없음",
      userIdLength: userId?.length || 0,
      comCode: comCode || "없음",
      comCodeLength: comCode?.length || 0,
    });

    // ZONE 검증 (2자리)
    if (!zone || zone.trim() === "") {
      console.error("[ECOUNT] ❌ ZONE이 설정되지 않았습니다. API 키 관리 페이지에서 ZONE을 입력해주세요. (예: CB, B, D, C 등)");
      return;
    }
    if (zone.trim().length !== 2) {
      console.error(`[ECOUNT] ❌ ZONE은 2자리여야 합니다. 현재: "${zone}" (${zone.length}자리)`);
      return;
    }

    // API_CERT_KEY 검증 (최대 50자리)
    if (!apiCertKey || apiCertKey.trim() === "") {
      console.error("[ECOUNT] ❌ API_CERT_KEY가 설정되지 않았습니다.");
      console.error("[ECOUNT] ⚠️ 'API_CERT_KEY (테스트 인증키)' 필드에 이카운트에서 발급받은 인증키를 입력해주세요.");
      return;
    }
    if (apiCertKey.trim().length > 50) {
      console.error(`[ECOUNT] ❌ API_CERT_KEY는 최대 50자리입니다. 현재: ${apiCertKey.length}자리`);
      return;
    }

    // USER_ID 검증 (최대 30자리)
    if (!userId || userId.trim() === "") {
      console.error("[ECOUNT] ❌ USER_ID가 설정되지 않았습니다.");
      console.error("[ECOUNT] ⚠️ 'USER_ID (사용자 ID)' 필드에 API_CERT_KEY를 발급받은 이카운트 ID를 입력해주세요.");
      return;
    }
    if (userId.trim().length > 30) {
      console.error(`[ECOUNT] ❌ USER_ID는 최대 30자리입니다. 현재: ${userId.length}자리`);
      return;
    }

    // COM_CODE 검증 (6자리)
    if (!comCode || comCode.trim() === "") {
      console.error("[ECOUNT] ❌ COM_CODE가 설정되지 않았습니다. API 키 관리 페이지에서 COM_CODE를 입력해주세요.");
      return;
    }
    if (comCode.trim().length !== 6) {
      console.error(`[ECOUNT] ❌ COM_CODE는 6자리여야 합니다. 현재: "${comCode}" (${comCode.length}자리)`);
      return;
    }

    console.log(`[ECOUNT] 인증 정보: ZONE=${zone}, API_CERT_KEY=${apiCertKey ? "있음" : "없음"}, USER_ID=${userId ? "있음" : "없음"}, COM_CODE=${comCode}`);

    // 1단계: 로그인 API 호출하여 SESSION_ID 받기
    // 이카운트 로그인 API: https://oapi{ZONE}.ecount.com/OAPI/V2/OAPILogin
    const loginEndpoint = `https://oapi${zone}.ecount.com/OAPI/V2/OAPILogin`;
    console.log(`[ECOUNT] 로그인 API 호출: ${loginEndpoint}`);

    let sessionId;
    try {
      // 이카운트 로그인 API Request Body 형식
      const loginRequestBody = {
        COM_CODE: comCode.trim(), // config에서 가져온 값 (필수)
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

      // HTTP 응답 상태 확인
      if (!loginResponse.ok) {
        const errorMsg = `HTTP ${loginResponse.status}: ${loginResponse.statusText}`;
        console.error(`[ECOUNT] ❌ 로그인 실패:`, errorMsg);
        console.error(`[ECOUNT] 로그인 응답 전체:`, JSON.stringify(loginResult, null, 2));
        return;
      }

      // 이카운트 API 문서에 따르면:
      // - 성공: Status="200" (또는 200) && Data.Code="00" && Data.Datas.SESSION_ID 존재
      // - 실패: Status="200"이지만 Data.Code가 "00"이 아니거나 Error 존재
      const status = loginResult?.Status;
      const isStatusOk = status === "200" || status === 200;

      if (!isStatusOk) {
        const errorMsg = loginResult?.Error?.Message || `예상치 못한 Status: ${status}`;
        console.error(`[ECOUNT] ❌ 로그인 실패:`, errorMsg);
        console.error(`[ECOUNT] 로그인 응답 전체:`, JSON.stringify(loginResult, null, 2));
        return;
      }

      // Error 필드가 있으면 실패
      if (loginResult?.Error) {
        const errorMsg = loginResult.Error.Message || "로그인 실패";
        console.error(`[ECOUNT] ❌ 로그인 실패:`, errorMsg);
        console.error(`[ECOUNT] 오류 코드:`, loginResult.Error.Code);
        console.error(`[ECOUNT] 로그인 응답 전체:`, JSON.stringify(loginResult, null, 2));
        return;
      }

      // Data.Code 확인
      const dataCode = loginResult?.Data?.Code;
      if (dataCode === "00") {
        // 성공: Data.Datas.SESSION_ID 확인
        if (loginResult?.Data?.Datas?.SESSION_ID) {
          sessionId = loginResult.Data.Datas.SESSION_ID;
          console.log(`[ECOUNT] ✅ 로그인 성공, SESSION_ID 획득: ${sessionId.substring(0, 10)}...`);
        } else {
          console.error(`[ECOUNT] ❌ 로그인 실패: SESSION_ID가 응답에 없습니다.`);
          console.error(`[ECOUNT] 로그인 응답 전체:`, JSON.stringify(loginResult, null, 2));
          return;
        }
      } else {
        // 실패: Data.Code가 "00"이 아님
        const errorMsg = loginResult?.Data?.Message || "로그인 실패";
        
        // Code 204: 테스트용 인증키 오류
        if (dataCode === "204") {
          console.error(`[ECOUNT] ❌ 로그인 실패 (Code: ${dataCode}): ${errorMsg}`);
          console.error(`[ECOUNT] ⚠️ 현재 테스트 인증키로는 실제 주문 처리가 불가능합니다.`);
          console.error(`[ECOUNT] 📋 운영 인증키 발급 방법:`);
          console.error(`[ECOUNT]    1. 이카운트 ERP 로그인`);
          console.error(`[ECOUNT]    2. Self-Customizing > 정보관리 > API인증키발급`);
          console.error(`[ECOUNT]    3. '운영 인증키' 또는 '검증 완료 인증키' 발급 요청`);
          console.error(`[ECOUNT]    4. 이카운트 담당자에게 검증 요청 (필요시)`);
          console.error(`[ECOUNT]    5. 발급받은 운영 인증키를 API 키 관리 페이지에 입력`);
          console.error(`[ECOUNT] 입력한 정보 확인:`);
          console.error(`  - COM_CODE: ${comCode}`);
          console.error(`  - USER_ID: ${userId}`);
          console.error(`  - API_CERT_KEY: ${apiCertKey ? "설정됨 (테스트용)" : "없음"}`);
          console.error(`  - ZONE: ${zone}`);
          console.error(`[ECOUNT] 로그인 응답 전체:`, JSON.stringify(loginResult, null, 2));
          return;
        }
        
        // 기타 오류
        console.error(`[ECOUNT] ❌ 로그인 실패 (Code: ${dataCode}):`, errorMsg);
        console.error(`[ECOUNT] 입력한 정보 확인:`);
        console.error(`  - COM_CODE: ${comCode}`);
        console.error(`  - USER_ID: ${userId}`);
        console.error(`  - API_CERT_KEY: ${apiCertKey ? "설정됨" : "없음"}`);
        console.error(`  - ZONE: ${zone}`);
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
