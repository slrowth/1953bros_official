import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 공지사항 목록 조회 API
 * GET /api/notices
 */
export async function GET(request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const audience = searchParams.get("audience");

    // 사용자 역할에 따라 볼 수 있는 공지사항 필터링
    let query = supabase
      .from("notices")
      .select(`
        *,
        author:users!notices_author_id_fkey(id, email, name)
      `)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    // audience 필터가 있으면 적용
    if (audience) {
      query = query.eq("audience", audience);
    } else {
      // 사용자 역할에 맞는 공지사항만 조회
      if (user.role === "STAFF") {
        query = query.in("audience", ["ALL", "STAFF"]);
      } else if (user.role === "OWNER" || user.role === "ADMIN") {
        query = query.in("audience", ["ALL", "FRANCHISEE"]);
      }
    }

    const { data: notices, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 현재 사용자가 읽은 공지사항 확인
    const { data: readNotices } = await supabase
      .from("notice_reads")
      .select("notice_id")
      .eq("user_id", user.id);

    const readNoticeIds = new Set(readNotices?.map((r) => r.notice_id) || []);

    // 읽음 여부 추가
    const noticesWithReadStatus = notices.map((notice) => ({
      ...notice,
      isRead: readNoticeIds.has(notice.id),
    }));

    return NextResponse.json({ notices: noticesWithReadStatus });
  } catch (error) {
    console.error("Notices fetch error:", error);
    return NextResponse.json(
      { error: "공지사항 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 공지사항 등록 API
 * POST /api/notices
 * ADMIN만 접근 가능
 */
export async function POST(request) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, audience, isPinned } = body;

    // 입력값 검증
    if (!title || !content || !audience) {
      return NextResponse.json(
        { error: "제목, 내용, 대상은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    if (!["ALL", "FRANCHISEE", "STAFF"].includes(audience)) {
      return NextResponse.json(
        { error: "올바른 대상 값을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: notice, error } = await supabase
      .from("notices")
      .insert({
        title,
        content,
        author_id: user.id,
        audience,
        is_pinned: isPinned || false,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    console.error("Notice create error:", error);
    return NextResponse.json(
      { error: "공지사항을 등록하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

