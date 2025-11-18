import { requireAuth } from "@/lib/server/auth";
import { requestEcountVerification } from "@/lib/integrations/ecount";
import { NextResponse } from "next/server";

/**
 * 이카운트 검증 요청 API
 * POST /api/integrations/ecount/verify
 * 테스트 인증키로 검증 요청을 전송
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const allowVerification =
      process.env.ECOUNT_ALLOW_TEST_VERIFICATION === "true" || process.env.NODE_ENV !== "production";

    if (!allowVerification) {
      return NextResponse.json(
        { error: "검증 요청은 테스트 환경에서만 실행 가능합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { keyId, sessionId } = body;

    if (!keyId) {
      return NextResponse.json({ error: "keyId가 필요합니다." }, { status: 400 });
    }

    const result = await requestEcountVerification(keyId, sessionId);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Ecount verification request error:", error);
    return NextResponse.json(
      { error: error.message || "검증 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

