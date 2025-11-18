import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("integration_keys")
      .select("id, label, zone, created_at")
      .eq("service", "ECOUNT")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ keys: data || [] });
  } catch (error) {
    console.error("Ecount key fetch error:", error);
    return NextResponse.json({ error: "키 목록을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { label, zone, apiKey, sessionId, comCode } = body;

    if (!label || !apiKey) {
      return NextResponse.json({ error: "라벨과 API KEY는 필수입니다." }, { status: 400 });
    }

    if (!comCode || comCode.trim() === "") {
      return NextResponse.json({ error: "COM_CODE(회사 코드)는 필수입니다." }, { status: 400 });
    }

    if (!zone || zone.trim() === "") {
      return NextResponse.json({ error: "ZONE은 필수입니다." }, { status: 400 });
    }

    if (!sessionId || sessionId.trim() === "") {
      return NextResponse.json({ error: "USER_ID(사용자 ID)는 필수입니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("integration_keys")
      .insert({
        service: "ECOUNT",
        label,
        zone: zone || "",
        api_key: apiKey,
        session_id: sessionId || "",
        config: {
          com_code: comCode.trim(),
        },
        created_by: user.id,
      })
      .select("id, label, zone, created_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ key: data }, { status: 201 });
  } catch (error) {
    console.error("Ecount key create error:", error);
    const errorMessage = error.message || "API 키 저장 중 오류가 발생했습니다.";
    const statusCode = error.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

