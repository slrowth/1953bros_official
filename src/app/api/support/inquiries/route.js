import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 20);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const supabase = await createClient();
    let query = supabase
      .from("support_inquiries")
      .select(
        `
          id,
          category,
          subject,
          message,
          page_path,
          status,
          created_at,
          updated_at,
          user:users!support_inquiries_user_id_fkey (
            id,
            name,
            email,
            store_name
          )
        `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (user.role !== "ADMIN") {
      query = query.eq("user_id", user.id);
    }

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    if (search) {
      const likeValue = `%${search}%`;
      query = query.or(`subject.ilike.${likeValue},message.ilike.${likeValue},page_path.ilike.${likeValue}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Support inquiry fetch error:", error);
      return NextResponse.json({ error: "문의 내역을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({ inquiries: data || [] });
  } catch (error) {
    console.error("Support inquiry GET error:", error);
    return NextResponse.json({ error: "문의 내역을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { category, subject, message, pagePath } = body;

    if (!category || !subject || !message) {
      return NextResponse.json({ error: "카테고리, 제목, 내용을 모두 입력해주세요." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("support_inquiries")
      .insert({
        user_id: user.id,
        category,
        subject,
        message,
        page_path: pagePath || null,
        status: "OPEN",
      })
      .select()
      .single();

    if (error) {
      console.error("Support inquiry insert error:", error);
      return NextResponse.json({ error: "문의 저장 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({ inquiry: data }, { status: 201 });
  } catch (error) {
    console.error("Support inquiry API error:", error);
    return NextResponse.json({ error: "문의 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}

