"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Minus, Plus, Search, Trash2, Loader2, X, Package, Calendar, ChevronDown, ChevronRight } from "lucide-react";
const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState({});
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingOrderHistory, setLoadingOrderHistory] = useState(true);
  const [orderHistoryError, setOrderHistoryError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const modalRef = useRef(null);

  const fetchOrderHistory = useCallback(async () => {
    try {
      setLoadingOrderHistory(true);
      setOrderHistoryError("");

      const response = await fetch("/api/orders");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "주문 내역을 불러올 수 없습니다.");
      }

      setOrderHistory(data.orders || []);
    } catch (error) {
      console.error("Order history fetch error:", error);
      setOrderHistory([]);
      setOrderHistoryError(error.message || "주문 내역을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoadingOrderHistory(false);
    }
  }, []);

  const handleCancelOrder = useCallback(
    async (orderId) => {
      if (!orderId) {
        return;
      }
      const confirmed = window.confirm("해당 주문을 취소하시겠습니까?");
      if (!confirmed) {
        return;
      }

      try {
        setCancellingOrderId(orderId);
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "주문 취소에 실패했습니다.");
        }
        await fetchOrderHistory();
        alert("주문이 취소되었습니다.");
      } catch (error) {
        console.error("Cancel order error:", error);
        alert(error.message || "주문 취소 중 오류가 발생했습니다.");
      } finally {
        setCancellingOrderId("");
      }
    },
    [fetchOrderHistory]
  );

  // 제품 목록 가져오기
  useEffect(() => {
    fetchProducts();
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  // 제품 목록이 로드되면 quantities 초기화
  useEffect(() => {
    if (products.length > 0) {
      setQuantities(
    Object.fromEntries(products.map((product) => [product.id, 0]))
  );
    }
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("/api/products?isActive=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "제품 목록을 불러오는데 실패했습니다.");
      }

      // 데이터베이스 필드명(snake_case)을 camelCase로 변환
      const transformedProducts = data.products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        price: parseFloat(product.price),
        currency: product.currency || "KRW",
        uom: product.uom,
        weightGrams: product.weight_grams,
        taxRate: parseFloat(product.tax_rate) / 100, // DB는 10.00 형태, 프론트는 0.1 형태
        categoryId: product.category_id,
        categoryName: product.category?.name || "기타",
        categoryDescription: product.category?.description || "",
        isShippable: product.is_shippable,
        leadTimeDays: product.lead_time_days,
        stock: product.stock,
        imageUrl: product.image_url,
        isActive: product.is_active,
        // 계산된 필드
        unitLabel: `₩${parseFloat(product.price).toLocaleString()} / ${product.uom}`,
      }));

      setProducts(transformedProducts);
      
      // 모든 카테고리를 기본적으로 펼쳐진 상태로 설정
      const categories = [...new Set(transformedProducts.map(p => p.categoryId))];
      const initialExpanded = {};
      categories.forEach(catId => {
        initialExpanded[catId] = true;
      });
      setExpandedCategories(initialExpanded);
    } catch (err) {
      console.error("Products fetch error:", err);
      setError(err.message || "제품 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 검색어에 따라 제품 필터링
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        product.categoryName.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // 카테고리별로 제품 그룹화
  const productsByCategory = useMemo(() => {
    const grouped = {};
    filteredProducts.forEach((product) => {
      const categoryId = product.categoryId;
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          id: categoryId,
          name: product.categoryName,
          description: product.categoryDescription,
          products: [],
        };
      }
      grouped[categoryId].products.push(product);
    });
    
    // 카테고리 순서 정의: 돼지국밥관련이 위에, 양념/소스류가 아래에
    const categoryOrder = ["돼지국밥관련", "양념/소스류"];
    
    // 카테고리를 지정된 순서로 정렬
    const sortedCategories = Object.values(grouped).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.name);
      const indexB = categoryOrder.indexOf(b.name);
      
      // 순서에 없는 카테고리는 맨 아래로
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
    
    // 정렬된 배열을 객체로 변환 (기존 구조 유지)
    const sortedGrouped = {};
    sortedCategories.forEach(category => {
      sortedGrouped[category.id] = category;
    });
    
    return sortedGrouped;
  }, [filteredProducts]);

  // 카테고리 토글
  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // 제품 상세 정보 가져오기
  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    setLoadingOrderItems(true);
    setOrderItems([]);

    try {
      const response = await fetch(`/api/products/${product.id}/order-items`);
      const data = await response.json();

      if (response.ok && data.orderItems) {
        // 데이터 변환
        const transformedItems = data.orderItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          status: item.status,
          createdAt: item.created_at,
          orderId: item.order?.id,
          orderStatus: item.order?.status,
          orderDate: item.order?.placed_at,
          storeName: item.order?.store?.name,
          franchiseName: item.order?.store?.franchise?.name,
        }));
        setOrderItems(transformedItems);
      }
    } catch (err) {
      console.error("Order items fetch error:", err);
    } finally {
      setLoadingOrderItems(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedProduct(null);
    setOrderItems([]);
  };

  // 외부 클릭 시 모달 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal();
      }
    };

    if (selectedProduct) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [selectedProduct]);

  const cartList = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products.find((item) => item.id === productId);
        if (!product) return null;
        return {
          id: productId,
          name: product.name,
          quantity,
          amount: product.price * quantity,
          unitPrice: product.price,
        };
      })
      .filter(Boolean);
  }, [cart]);

  const cartTotal = cartList.reduce((sum, item) => sum + item.amount, 0);
  const cartTotalQuantity = cartList.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (productId, delta) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [productId]: next,
      };
    });
  };

  const handleAddToOrder = (productId) => {
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

  const handleSubmitOrder = async () => {
    if (cartList.length === 0) {
      return;
    }

    setIsSubmittingOrder(true);
    setError("");

    try {
      // API에 전송할 데이터 준비
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
          shippingAddress: "배송지 정보 없음", // 추후 사용자 입력으로 변경 가능
          shippingMethod: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "주문 제출에 실패했습니다.");
      }

      await fetchOrderHistory();
    setCart({});
      setQuantities({});

      // 성공 메시지 (선택사항)
      alert("주문이 성공적으로 제출되었습니다.");
    } catch (err) {
      console.error("Order submission error:", err);
      setError(err.message || "주문 제출 중 오류가 발생했습니다.");
      alert(`주문 제출 실패: ${err.message || "알 수 없는 오류가 발생했습니다."}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleUpdateCartQuantity = (productId, delta) => {
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

  const handleRemoveFromCart = (productId) => {
    setCart((prev) => {
      const { [productId]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6 min-w-0">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">주문 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              제품을 주문하고 주문 현황을 확인하세요
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <header className="mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">제품 카탈로그</h2>
                <p className="mt-1 text-xs text-slate-500">
                  필요한 상품의 수량을 선택해 주문을 진행하세요.
                </p>
              </div>
            </header>

            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-slate-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="제품 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#967d5a]" />
                <span className="ml-3 text-sm text-slate-500">제품 목록을 불러오는 중...</span>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-6 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  다시 시도
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl bg-neutral-50 px-4 py-6 text-center text-sm text-slate-400">
                등록된 제품이 없습니다.
              </div>
            ) : Object.keys(productsByCategory).length === 0 ? (
              <div className="rounded-xl bg-neutral-50 px-4 py-6 text-center text-sm text-slate-400">
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(productsByCategory).map((category) => {
                  const isExpanded = expandedCategories[category.id] !== false;
                  const productCount = category.products.length;
                  
                  return (
                    <div key={category.id} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                      {/* 카테고리 헤더 */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          )}
                          <div className="text-left">
                            <h3 className="text-base font-semibold text-slate-900">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-slate-500">
                          {productCount}개 제품
                        </span>
                      </button>

                      {/* 카테고리 제품 목록 */}
                      {isExpanded && (
                        <div className="p-4 space-y-3">
                          {category.products.map((product) => {
                const currentQty = quantities[product.id] ?? 0;
                return (
                  <article
                    key={product.id}
                                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#967d5a]"
                  >
                                <div 
                                  className="flex-1 cursor-pointer"
                                  onClick={() => handleProductClick(product)}
                                >
                                  <h3 className="text-sm font-semibold text-slate-900 hover:text-[#967d5a]">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                                    {product.unitLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-neutral-200 transition hover:text-[#967d5a]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(product.id, -1);
                                      }}
                          aria-label={`${product.name} 수량 감소`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-slate-700">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#967d5a] text-white transition hover:bg-[#7a6548]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(product.id, 1);
                                      }}
                          aria-label={`${product.name} 수량 증가`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToOrder(product.id);
                                    }}
                        className="rounded-xl bg-[#967d5a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7a6548]"
                      >
                                    Add
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="space-y-6 lg:sticky lg:top-[108px] lg:max-h-[calc(100vh-108px)] lg:overflow-y-auto lg:pr-1">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">🛒 주문 요약</h2>
            {cartList.length === 0 ? (
              <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-6 text-center text-sm text-slate-400">
                주문한 제품이 없습니다
              </p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {cartList.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">주문 단가: {currencyFormatter.format(item.amount / item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-slate-500 transition hover:text-[#967d5a]"
                          onClick={() => handleUpdateCartQuantity(item.id, -1)}
                          aria-label={`${item.name} 수량 감소`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-slate-700">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#967d5a] text-white transition hover:bg-[#7a6548]"
                          onClick={() => handleUpdateCartQuantity(item.id, 1)}
                          aria-label={`${item.name} 수량 증가`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {currencyFormatter.format(item.amount)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          삭제
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 border-t border-neutral-200 pt-4 text-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span>총액</span>
                <span className="text-base font-semibold text-slate-900">
                  {currencyFormatter.format(cartTotal)}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                총 수량 {cartTotalQuantity}건
              </div>
              <button
                type="button"
                onClick={handleSubmitOrder}
                className="mt-4 w-full rounded-xl bg-[#967d5a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#7a6548] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                disabled={cartList.length === 0 || isSubmittingOrder}
              >
                {isSubmittingOrder ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    제출 중...
                  </span>
                ) : (
                  "주문 제출"
                )}
              </button>
            </div>
          </div>

            <OrderHistoryPanel
              orders={orderHistory}
              loading={loadingOrderHistory}
              error={orderHistoryError}
              onCancelOrder={handleCancelOrder}
              cancellingOrderId={cancellingOrderId}
            />
          </div>
        </aside>
      </div>
      </div>

      {/* 제품 상세 모달 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">제품 상세 정보</h2>
              <button
                onClick={handleCloseModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 제품 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedProduct.name}</h3>
                <p className="mt-1 text-sm text-slate-500">SKU: {selectedProduct.sku}</p>
              </div>

              {/* 설명 */}
              {selectedProduct.description && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">제품 설명</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* 가격 정보 */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">가격 정보</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">공급가</span>
                    <span className="font-semibold text-slate-900">
                      {currencyFormatter.format(selectedProduct.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">부가세 ({selectedProduct.taxRate * 100}%)</span>
                    <span className="font-semibold text-slate-900">
                      {currencyFormatter.format(selectedProduct.price * selectedProduct.taxRate)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-200">
                    <span className="font-semibold text-slate-900">총액</span>
                    <span className="font-semibold text-lg text-[#967d5a]">
                      {currencyFormatter.format(selectedProduct.price * (1 + selectedProduct.taxRate))}
                    </span>
                  </div>
                </div>
              </div>

              {/* 최근 구매 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  최근 구매 내역
                </h4>
                {loadingOrderItems ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#967d5a]" />
                    <span className="ml-2 text-sm text-slate-500">구매 내역을 불러오는 중...</span>
                  </div>
                ) : orderItems.length === 0 ? (
                  <div className="rounded-xl bg-neutral-50 px-4 py-6 text-center text-sm text-slate-400">
                    구매 내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-neutral-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-slate-500">
                                주문번호: {item.orderId?.slice(0, 8) || "N/A"}
                              </span>
                              {item.storeName && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-slate-500">{item.storeName}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-slate-600">
                                수량: <span className="font-semibold text-slate-900">{item.quantity}</span>
                              </span>
                              <span className="text-slate-600">
                                단가: <span className="font-semibold text-slate-900">
                                  {currencyFormatter.format(item.unitPrice)}
                                </span>
                              </span>
                              <span className="text-slate-600">
                                총액: <span className="font-semibold text-[#967d5a]">
                                  {currencyFormatter.format(item.unitPrice * item.quantity)}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {item.orderDate && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.orderDate).toLocaleDateString("ko-KR")}
                              </div>
                            )}
                            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                              item.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                              item.status === "ALLOCATED" ? "bg-amber-100 text-amber-700" :
                              item.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                              "bg-neutral-100 text-neutral-700"
                            }`}>
                              {item.status === "SHIPPED" ? "배송완료" :
                               item.status === "ALLOCATED" ? "배정완료" :
                               item.status === "CANCELLED" ? "취소됨" : "대기중"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ tone, children }) {
  const toneClasses = {
    success: "bg-emerald-50 text-emerald-600 border-emerald-200",
    warning: "bg-amber-50 text-amber-600 border-amber-200",
    info: "bg-blue-50 text-blue-600 border-blue-200",
  }[tone] || "bg-neutral-100 text-neutral-600 border-neutral-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses}`}>
      {children}
    </span>
  );
}

function OrderHistoryPanel({ orders, loading, error, onCancelOrder, cancellingOrderId }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">📦 주문 내역</h2>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-[#967d5a]" />
          <span>주문 내역을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">📦 주문 내역</h2>
        </div>
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">📦 주문 내역</h2>
        </div>
        <div className="mt-6 rounded-xl bg-neutral-50 px-4 py-6 text-center text-sm text-slate-400">
          최근 주문 내역이 없습니다.
        </div>
      </div>
    );
  }

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const groupedByScope = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const monthKey = order.orderedAt.slice(0, 7);
        const scope = monthKey === currentMonthKey ? "thisMonth" : "all";
        if (!acc[scope]) {
          acc[scope] = {};
        }
        if (!acc[scope][order.status]) {
          acc[scope][order.status] = [];
        }
        acc[scope][order.status].push(order);
        return acc;
      },
      { thisMonth: {}, all: {} }
    );
  }, [orders, currentMonthKey]);

  const summaryCounts = useMemo(() => {
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const [expandedScope, setExpandedScope] = useState("thisMonth");
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const statusOrder = ["입금대기", "주문확인", "배송중", "배송완료", "취소됨"];

  const renderOrder = (order) => {
    const totalAmount = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const isExpanded = !!expandedOrders[order.id];

    return (
      <div key={order.id} className="rounded-2xl border border-neutral-200">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm text-slate-700 transition hover:bg-neutral-50"
          onClick={() => toggleOrder(order.id)}
        >
          <div className="flex flex-col items-start">
            <span className="text-lg font-bold text-slate-900">
              {currencyFormatter.format(totalAmount)}
            </span>
            <span className="mt-1 text-xs text-slate-500">
              제품 {order.items.length}종 · 수량 {totalQuantity}
            </span>
            <span className="mt-1 text-xs text-slate-500">
              주문일 {order.orderedAt}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge tone={order.statusTone}>{order.status}</StatusBadge>
          </div>
        </button>
        {isExpanded && (
          <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-4">
            <div className="mb-3 space-y-1 text-xs text-slate-400">
              <div>주문번호: {order.id}</div>
              <div>납품예정: {order.deliveryDate}</div>
            </div>
            {order.statusCode === "NEW" && (
              <div className="mb-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelOrder?.(order.id);
                  }}
                  disabled={cancellingOrderId === order.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
                >
                  {cancellingOrderId === order.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      취소 중...
                    </>
                  ) : (
                    "주문 취소"
                  )}
                </button>
              </div>
            )}
            <ul className="space-y-3 text-sm text-slate-600">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      수량 {item.quantity} · 단가 {currencyFormatter.format(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium text-slate-900">
                    {currencyFormatter.format(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderScopeSection = (scope, scopeOrders) => {
    if (!scopeOrders) {
      return null;
    }

    const scopeLabel = scope === "thisMonth" ? "이번달 주문 현황" : "전체 주문 현황";

    return (
      <div key={scope} className="rounded-2xl border border-neutral-200">
        <button
          type="button"
          className="flex w-full items-center justify-between bg-neutral-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-neutral-100"
          onClick={() => setExpandedScope((prev) => (prev === scope ? "" : scope))}
        >
          {scopeLabel}
          <span className="text-xs text-slate-400">
            {expandedScope === scope ? "숨기기" : "보기"}
          </span>
        </button>
        {expandedScope === scope && (
          <div className="space-y-4 px-4 py-4">
            {statusOrder.map((status) => {
              const ordersByStatus = scopeOrders[status];
              if (!ordersByStatus || ordersByStatus.length === 0) {
                return null;
              }
              return (
                <section key={status} className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {status}
                    <span className="ml-2 text-xs text-slate-400">
                      {ordersByStatus.length}건
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {ordersByStatus.map((order) => renderOrder(order))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">📦 주문 내역</h2>
          <div className="flex flex-col items-end text-[10px] text-slate-500">
            <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-1">
              {Object.entries(summaryCounts).map(([status, count]) => (
                <span
                  key={status}
                  className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium whitespace-nowrap text-right"
                >
                  {status} {count}
                </span>
              ))}
            </div>
          </div>
        </div>

      <div className="mt-4 space-y-3">
        {renderScopeSection("thisMonth", groupedByScope.thisMonth)}
        {renderScopeSection("all", groupedByScope.all)}
      </div>
    </div>
  );
}

