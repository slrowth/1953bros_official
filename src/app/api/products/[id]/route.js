import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 상품 상세 조회 API
 * GET /api/products/[id]
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

    const supabase = await createClient();
    const { id } = await params;

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        category:product_categories(
          id,
          name,
          description
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // 제품을 찾을 수 없음
        return NextResponse.json(
          { error: "제품을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: "제품 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 상품 수정 API
 * PUT /api/products/[id]
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
    const {
      name,
      sku,
      description,
      categoryId,
      price,
      currency,
      stock,
      isActive,
      imageUrl,
      uom,
      weightGrams,
      taxRate,
      isShippable,
      leadTimeDays,
    } = body;

    const supabase = await createClient();

    // 상품 존재 확인
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id, sku")
      .eq("id", id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: "제품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // SKU 변경 시 중복 확인
    if (sku && sku !== existingProduct.sku) {
      const { data: duplicateProduct } = await supabase
        .from("products")
        .select("id")
        .eq("sku", sku)
        .single();

      if (duplicateProduct) {
        return NextResponse.json(
          { error: "이미 존재하는 SKU입니다." },
          { status: 400 }
        );
      }
    }

    // 업데이트할 데이터 구성
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (description !== undefined) updateData.description = description || null;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (currency !== undefined) updateData.currency = currency;
    if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (imageUrl !== undefined) updateData.image_url = imageUrl || null;
    if (uom !== undefined) updateData.uom = uom;
    if (weightGrams !== undefined) updateData.weight_grams = weightGrams ? parseInt(weightGrams) : null;
    if (taxRate !== undefined) updateData.tax_rate = parseFloat(taxRate);
    if (isShippable !== undefined) updateData.is_shippable = isShippable;
    if (leadTimeDays !== undefined) updateData.lead_time_days = leadTimeDays ? parseInt(leadTimeDays) : null;
    updateData.updated_at = new Date().toISOString();

    // 상품 수정
    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
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
      console.error("Product update error:", error);
      return NextResponse.json(
        { error: error.message || "상품 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "상품 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 상품 삭제 API
 * DELETE /api/products/[id]
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

    // 상품 존재 확인
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: "제품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 주문에 포함된 상품인지 확인
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("id")
      .eq("product_id", id)
      .limit(1);

    if (orderItems && orderItems.length > 0) {
      // 주문에 포함된 상품은 삭제 대신 비활성화
      const { error: updateError } = await supabase
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: "상품 비활성화에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "주문에 포함된 상품이므로 삭제 대신 비활성화되었습니다.",
        product: { id, is_active: false },
      });
    }

    // 상품 삭제
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Product deletion error:", error);
      return NextResponse.json(
        { error: error.message || "상품 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "상품이 삭제되었습니다." });
  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json(
      { error: "상품 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


