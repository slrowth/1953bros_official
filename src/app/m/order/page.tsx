/**
 * 모바일 주문하기 페이지
 * 상품 선택 및 주문 제출
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, ShoppingCart, X, Package } from "lucide-react";
import MobileLayout from "@/components/mobile/MobileLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { formatCurrency } from "@/utils/formatCurrency";

export default function MobileOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products?isActive=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "제품 목록을 불러오는데 실패했습니다.");
      }

      const transformedProducts = data.products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        price: parseFloat(product.price),
        currency: product.currency || "KRW",
        uom: product.uom,
        taxRate: parseFloat(product.tax_rate) / 100,
        categoryName: product.category?.name || "기타",
        imageUrl: product.image_url,
      }));

      setProducts(transformedProducts);
      setQuantities(
        Object.fromEntries(transformedProducts.map((product) => [product.id, 0]))
      );
    } catch (err) {
      console.error("Products fetch error:", err);
      setError(err.message || "제품 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const cartList = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products.find((item) => item.id === productId);
        if (!product) return null;
        const qty = Number(quantity) || 0;
        return {
          id: productId,
          name: product.name,
          quantity: qty,
          amount: product.price * qty,
          unitPrice: product.price,
        };
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartTotal = cartList.reduce((sum, item) => sum + item.amount, 0);
  const cartTotalQuantity = cartList.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [productId]: next,
      };
    });
  };

  const handleAddToCart = (productId: string) => {
    setCart((prev) => {
      const selectedQty = quantities[productId] ?? 0;
      const quantity = Math.max(1, selectedQty);
      return {
        ...prev,
        [productId]: (prev[productId] || 0) + quantity,
      };
    });
    setQuantities((prev) => ({
      ...prev,
      [productId]: 0,
    }));
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next > 0) {
        return {
          ...prev,
          [productId]: next,
        };
      }
      const { [productId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmitOrder = async () => {
    if (cartList.length === 0) {
      return;
    }

    setIsSubmittingOrder(true);
    setError("");

    try {
      const orderItems = cartList.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress: "배송지 정보 없음",
          shippingMethod: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "주문 제출에 실패했습니다.");
      }

      setCart({});
      setQuantities({});
      alert("주문이 성공적으로 제출되었습니다.");
      router.push("/m/order/status");
    } catch (err) {
      console.error("Order submission error:", err);
      setError(err.message || "주문 제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <MobileLayout
      title="주문하기"
      headerRightAction={
        cartTotalQuantity > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg transition hover:bg-neutral-100 active:bg-neutral-200"
            aria-label="장바구니"
          >
            <ShoppingCart className="h-5 w-5 text-slate-700" />
            {cartTotalQuantity > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#967d5a] text-xs font-semibold text-white">
                {cartTotalQuantity}
              </span>
            )}
          </button>
        )
      }
      headerBottomContent={
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="상품명 또는 SKU 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm focus:border-[#967d5a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            />
          </div>
        </div>
      }
    >
      <div className="flex flex-col">

        {/* 상품 목록 */}
        {loading ? (
          <LoadingSpinner message="상품을 불러오는 중..." />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={fetchProducts} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-900">상품을 찾을 수 없습니다</p>
            <p className="mt-1 text-xs text-slate-500">다른 검색어를 시도해보세요</p>
          </div>
        ) : (
          <div className="px-4 pt-4 pb-4 space-y-3">
            {filteredProducts.map((product) => {
              const quantity = quantities[product.id] || 0;
              const cartQuantity = cart[product.id] || 0;
              // 상품별 담기 버튼에 표시할 텍스트/접근성 라벨을 계산합니다.
              // - 모바일 화면이 좁아도 글자가 깨지지 않도록, 담긴 수량은 숫자만 표시합니다.
              const cart_button_label = cartQuantity > 0 ? String(cartQuantity) : "담기";
              const cart_button_aria_label =
                cartQuantity > 0 ? `장바구니에 ${cartQuantity}개 담김` : "장바구니에 담기";

              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                        <Package className="h-8 w-8 text-slate-300" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 leading-tight break-words">
                        {product.name}
                      </h3>
                      {product.sku && (
                        <p className="mt-1 text-xs text-slate-500">SKU: {product.sku}</p>
                      )}
                      <p className="mt-2 text-lg font-bold text-[#967d5a]">
                        {formatCurrency(product.price)} / {product.uom}
                      </p>

                      {/* 수량 선택 */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border border-neutral-200">
                          <button
                            onClick={() => handleQuantityChange(product.id, -1)}
                            className="flex h-10 w-10 items-center justify-center transition active:bg-neutral-100"
                            disabled={quantity === 0}
                          >
                            <Minus className="h-4 w-4 text-slate-600" />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-medium text-slate-900">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(product.id, 1)}
                            className="flex h-10 w-10 items-center justify-center transition active:bg-neutral-100"
                          >
                            <Plus className="h-4 w-4 text-slate-600" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleAddToCart(product.id)}
                          aria-label={cart_button_aria_label}
                          className="flex-1 whitespace-nowrap rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-semibold text-white transition active:bg-[#7a6548]"
                        >
                          {cart_button_label}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 장바구니 하단 고정 */}
        {cartTotalQuantity > 0 && (
          <div 
            className="fixed left-0 right-0 z-[60] border-t border-neutral-200 bg-white px-4 pt-4 shadow-lg" 
            style={{ 
              bottom: `calc(4rem + env(safe-area-inset-bottom, 0))`,
              paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0))`
            }}
          >
            <div className="mx-auto flex max-w-md items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">총 {cartTotalQuantity}개</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(cartTotal)}</p>
              </div>
              <button
                onClick={() => setShowCart(true)}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-neutral-200 bg-white transition active:bg-neutral-50"
                aria-label="장바구니 보기"
              >
                <ShoppingCart className="h-5 w-5 text-slate-700" />
                {cartTotalQuantity > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#967d5a] text-xs font-semibold text-white">
                    {cartTotalQuantity}
                  </span>
                )}
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmittingOrder || cartList.length === 0}
                className="flex-1 rounded-xl bg-[#967d5a] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed active:bg-[#7a6548]"
              >
                {isSubmittingOrder ? "주문 중..." : "주문하기"}
              </button>
            </div>
          </div>
        )}

        {/* 장바구니 모달 */}
        {showCart && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCart(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0))' }}
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white p-4">
                <h3 className="text-lg font-semibold text-slate-900">장바구니</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition active:bg-neutral-100"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {cartList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white">
                        <button
                          onClick={() => handleUpdateCartQuantity(item.id, -1)}
                          className="flex h-8 w-8 items-center justify-center transition active:bg-neutral-100"
                        >
                          <Minus className="h-3 w-3 text-slate-600" />
                        </button>
                        <span className="min-w-[2rem] text-center text-xs font-medium text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateCartQuantity(item.id, 1)}
                          className="flex h-8 w-8 items-center justify-center transition active:bg-neutral-100"
                        >
                          <Plus className="h-3 w-3 text-slate-600" />
                        </button>
                      </div>
                      <p className="w-20 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">총 주문 금액</p>
                  <p className="text-xl font-bold text-[#967d5a]">{formatCurrency(cartTotal)}</p>
                </div>
                <button
                  onClick={() => {
                    handleSubmitOrder();
                    setShowCart(false);
                  }}
                  disabled={isSubmittingOrder}
                  className="w-full rounded-xl bg-[#967d5a] py-3 text-sm font-semibold text-white transition disabled:opacity-50 active:bg-[#7a6548]"
                >
                  {isSubmittingOrder ? "주문 중..." : "주문하기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
