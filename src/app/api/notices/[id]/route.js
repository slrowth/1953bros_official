import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 공지사항 상세 조회 API
 * GET /api/notices/[id]
 */
export async function GET(request, { params }) {
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

    const { data: notice, error } = await supabase
      .from("notices")
      .select(`
        *,
        author:users!notices_author_id_fkey(id, email, name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (!notice) {
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

    // 읽음 여부 확인
    const { data: readRecord } = await supabase
      .from("notice_reads")
      .select("read_at")
      .eq("notice_id", id)
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      notice: {
        ...notice,
        isRead: !!readRecord,
        readAt: readRecord?.read_at || null,
      },
    });
  } catch (error) {
    console.error("Notice fetch error:", error);
    return NextResponse.json(
      { error: "공지사항을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 공지사항 수정 API
 * PUT /api/notices/[id]
 * ADMIN만 접근 가능
 */
export async function PUT(request, { params }) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, audience, isPinned } = body;

    const supabase = await createClient();

    // 공지사항 존재 확인
    const { data: existingNotice, error: fetchError } = await supabase
      .from("notices")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingNotice) {
      return NextResponse.json(
        { error: "공지사항을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 구성
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (audience !== undefined) {
      if (!["ALL", "FRANCHISEE", "STAFF"].includes(audience)) {
        return NextResponse.json(
          { error: "올바른 대상 값을 입력해주세요." },
          { status: 400 }
        );
      }
      updateData.audience = audience;
    }
    if (isPinned !== undefined) updateData.is_pinned = isPinned;

    const { data: notice, error } = await supabase
      .from("notices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ notice });
  } catch (error) {
    console.error("Notice update error:", error);
    return NextResponse.json(
      { error: "공지사항을 수정하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 공지사항 삭제 API
 * DELETE /api/notices/[id]
 * ADMIN만 접근 가능
 */
export async function DELETE(request, { params }) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // 공지사항 존재 확인
    const { data: existingNotice, error: fetchError } = await supabase
      .from("notices")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingNotice) {
      return NextResponse.json(
        { error: "공지사항을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("notices").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "공지사항이 삭제되었습니다." });
  } catch (error) {
    console.error("Notice delete error:", error);
    return NextResponse.json(
      { error: "공지사항을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

