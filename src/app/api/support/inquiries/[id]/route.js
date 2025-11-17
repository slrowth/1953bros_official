import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth";
import { NextResponse } from "next/server";

const VALID_STATUS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: "유효한 상태값을 입력해주세요." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("support_inquiries")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Support inquiry update error:", error);
      return NextResponse.json({ error: "문의 상태를 업데이트하는 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({ inquiry: data });
  } catch (error) {
    console.error("Support inquiry PATCH error:", error);
    return NextResponse.json({ error: "문의 상태를 업데이트하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

