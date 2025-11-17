import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 공지사항 읽음 처리 API
 * POST /api/notices/[id]/read
 */
export async function POST(request, { params }) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // 공지사항 존재 확인
    const { data: notice, error: noticeError } = await supabase
      .from("notices")
      .select("id, audience")
      .eq("id", id)
      .single();

    if (noticeError || !notice) {
      return NextResponse.json(
        { error: "공지사항을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 역할에 따라 접근 권한 확인
    if (notice.audience === "FRANCHISEE" && user.role === "STAFF") {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    if (notice.audience === "STAFF" && user.role !== "STAFF") {
      return NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 이미 읽은 기록이 있는지 확인
    const { data: existingRead } = await supabase
      .from("notice_reads")
      .select("read_at")
      .eq("notice_id", id)
      .eq("user_id", user.id)
      .single();

    // 이미 읽은 경우 기존 기록 반환
    if (existingRead) {
      return NextResponse.json({
        message: "이미 읽은 공지사항입니다.",
        readAt: existingRead.read_at,
      });
    }

    // 읽음 기록 생성
    const { data: readRecord, error } = await supabase
      .from("notice_reads")
      .insert({
        notice_id: id,
        user_id: user.id,
        read_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "공지사항을 읽음 처리했습니다.",
      readAt: readRecord.read_at,
    });
  } catch (error) {
    console.error("Notice read error:", error);
    return NextResponse.json(
      { error: "공지사항 읽음 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

