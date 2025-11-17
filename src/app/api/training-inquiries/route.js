import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 교육 자료 문의 목록 조회 API
 * GET /api/training-inquiries
 * ADMIN: 모든 문의 조회 가능
 * 일반 사용자: 자신의 문의만 조회 가능
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
    const trainingMaterialId = searchParams.get("trainingMaterialId");
    const status = searchParams.get("status");
    const isAdmin = user.role === "ADMIN";

    let query = supabase
      .from("training_inquiries")
      .select(`
        *,
        user:users!training_inquiries_user_id_fkey(id, email, name, store_name),
        training_material:training_materials!training_inquiries_training_material_id_fkey(id, title),
        answered_by:users!training_inquiries_answered_by_id_fkey(id, email, name)
      `)
      .order("created_at", { ascending: false });

    // 일반 사용자는 자신의 문의만 조회 가능
    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    if (trainingMaterialId) {
      query = query.eq("training_material_id", trainingMaterialId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error("Fetch training inquiries error:", error);
      return NextResponse.json(
        { error: "문의 목록을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 데이터 변환
    const transformedInquiries = (inquiries || []).map((inquiry) => ({
      id: inquiry.id,
      trainingMaterialId: inquiry.training_material_id,
      trainingMaterial: inquiry.training_material
        ? {
            id: inquiry.training_material.id,
            title: inquiry.training_material.title,
          }
        : null,
      userId: inquiry.user_id,
      user: inquiry.user
        ? {
            id: inquiry.user.id,
            email: inquiry.user.email,
            name: inquiry.user.name,
            storeName: inquiry.user.store_name,
          }
        : null,
      question: inquiry.question,
      status: inquiry.status,
      answer: inquiry.answer,
      answeredById: inquiry.answered_by_id,
      answeredBy: inquiry.answered_by
        ? {
            id: inquiry.answered_by.id,
            email: inquiry.answered_by.email,
            name: inquiry.answered_by.name,
          }
        : null,
      answeredAt: inquiry.answered_at,
      createdAt: inquiry.created_at,
      updatedAt: inquiry.updated_at,
    }));

    return NextResponse.json({ inquiries: transformedInquiries });
  } catch (error) {
    console.error("Training inquiries API error:", error);
    return NextResponse.json(
      { error: "문의 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 교육 자료 문의 등록 API
 * POST /api/training-inquiries
 */
export async function POST(request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { trainingMaterialId, question } = body;

    // 입력값 검증
    if (!trainingMaterialId || !question) {
      return NextResponse.json(
        { error: "교육 자료 ID와 문의 내용은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 교육 자료 존재 확인
    const { data: material, error: materialError } = await supabase
      .from("training_materials")
      .select("id")
      .eq("id", trainingMaterialId)
      .single();

    if (materialError || !material) {
      return NextResponse.json(
        { error: "교육 자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { data: inquiry, error } = await supabase
      .from("training_inquiries")
      .insert({
        training_material_id: trainingMaterialId,
        user_id: user.id,
        question,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      console.error("Create training inquiry error:", error);
      return NextResponse.json(
        { error: error.message || "문의 등록 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        inquiry: {
          id: inquiry.id,
          trainingMaterialId: inquiry.training_material_id,
          userId: inquiry.user_id,
          question: inquiry.question,
          status: inquiry.status,
          createdAt: inquiry.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Training inquiry create error:", error);
    return NextResponse.json(
      { error: "문의 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

