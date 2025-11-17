import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const user = await requireRole("ADMIN");
    if (!user) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "API 키 ID가 필요합니다." }, { status: 400 });
    }

    // RLS를 우회하기 위해 서비스 역할 클라이언트 사용
    const adminSupabase = createAdminClient();
    
    // 먼저 키가 존재하는지 확인
    const { data: existingKey, error: checkError } = await adminSupabase
      .from("integration_keys")
      .select("id, service")
      .eq("id", id)
      .eq("service", "ECOUNT")
      .single();

    if (checkError || !existingKey) {
      console.error("Ecount key delete - key not found:", checkError);
      return NextResponse.json({ error: "삭제할 API 키를 찾을 수 없습니다." }, { status: 404 });
    }

    // 삭제 실행
    const { error: deleteError } = await adminSupabase
      .from("integration_keys")
      .delete()
      .eq("id", id)
      .eq("service", "ECOUNT");

    if (deleteError) {
      console.error("Ecount key delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "API 키 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "API 키가 삭제되었습니다." });
  } catch (error) {
    console.error("Ecount key delete error:", error);
    return NextResponse.json(
      { error: error.message || "API 키 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

