"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { id } = params;
    const supabase = await createClient();
    const { error } = await supabase.from("integration_keys").delete().eq("id", id).eq("service", "ECOUNT");

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ecount key delete error:", error);
    return NextResponse.json({ error: "API 키 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}

