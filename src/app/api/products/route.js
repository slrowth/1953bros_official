import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 상품 목록 조회 API
 * GET /api/products
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
    const isActive = searchParams.get("isActive");

    let query = supabase
      .from("products")
      .select(`
        *,
        category:product_categories!inner(
          id,
          name,
          description
        )
      `)
      .order("created_at", { ascending: false });

    // 활성화된 상품만 조회하는 경우
    if (isActive === "true") {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "상품 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 상품 등록 API
 * POST /api/products
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
    const {
      name,
      sku,
      description,
      categoryId,
      price,
      currency = "KRW",
      stock = 0,
      isActive = true,
      imageUrl,
      uom,
      weightGrams,
      taxRate = 10.0,
      isShippable = true,
      leadTimeDays,
    } = body;

    // 필수 필드 검증
    if (!name || !sku || !categoryId || price === undefined || !uom) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // SKU 중복 확인
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("sku", sku)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: "이미 존재하는 SKU입니다." },
        { status: 400 }
      );
    }

    // 상품 등록
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        sku,
        description: description || null,
        category_id: categoryId,
        price: parseFloat(price),
        currency,
        stock: parseInt(stock) || 0,
        is_active: isActive,
        image_url: imageUrl || null,
        uom,
        weight_grams: weightGrams ? parseInt(weightGrams) : null,
        tax_rate: parseFloat(taxRate),
        is_shippable: isShippable,
        lead_time_days: leadTimeDays ? parseInt(leadTimeDays) : null,
      })
      .select(`
        *,
        category:product_categories(
          id,
          name,
          description
        )
      `)
      .single();

    if (error) {
      console.error("Product creation error:", error);
      return NextResponse.json(
        { error: error.message || "상품 등록에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "상품 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

