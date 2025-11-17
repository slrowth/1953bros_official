import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 교육 자료 문의 답변 API
 * PUT /api/training-inquiries/[id]
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
    const { answer, status } = body;

    const supabase = await createClient();

    // 문의 존재 확인
    const { data: existingInquiry, error: fetchError } = await supabase
      .from("training_inquiries")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !existingInquiry) {
      return NextResponse.json(
        { error: "문의를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 구성
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (answer !== undefined) {
      updateData.answer = answer;
    }

    if (status !== undefined) {
      const validStatuses = ["PENDING", "ANSWERED", "CLOSED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "올바른 상태 값을 입력해주세요." },
          { status: 400 }
        );
      }
      updateData.status = status;

      // 답변 완료 시 답변자 정보 및 답변 시간 업데이트
      if (status === "ANSWERED" && answer) {
        updateData.answered_by_id = user.id;
        updateData.answered_at = new Date().toISOString();
      }
    }

    const { data: inquiry, error } = await supabase
      .from("training_inquiries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update training inquiry error:", error);
      return NextResponse.json(
        { error: error.message || "문의 답변 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      inquiry: {
        id: inquiry.id,
        status: inquiry.status,
        answer: inquiry.answer,
        answeredById: inquiry.answered_by_id,
        answeredAt: inquiry.answered_at,
      },
    });
  } catch (error) {
    console.error("Training inquiry update error:", error);
    return NextResponse.json(
      { error: "문의 답변 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

