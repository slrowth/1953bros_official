"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, Package, TrendingUp, Store, Building2, Filter, AlertCircle } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

const STATUS_OPTIONS = [
  { value: "NEW", label: "입금대기", color: "bg-yellow-100 text-yellow-800" },
  { value: "PROCESSING", label: "주문확인", color: "bg-blue-100 text-blue-800" },
  { value: "SHIPPED", label: "배송중", color: "bg-purple-100 text-purple-800" },
  { value: "DELIVERED", label: "배송완료", color: "bg-green-100 text-green-800" },
  { value: "CANCELLED", label: "취소됨", color: "bg-red-100 text-red-800" },
];

export default function OrdersByProductPage() {
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewOrdersOnly, setShowNewOrdersOnly] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedStores, setExpandedStores] = useState({});

  useEffect(() => {
    fetchStores();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [selectedStoreId, selectedStatus, showNewOrdersOnly]);

  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      params.append("isActive", "true");
      const response = await fetch(`/api/stores?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error("Fetch stores error:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (selectedStoreId !== "all") {
        params.append("storeId", selectedStoreId);
      }
      // 신규주문 필터가 활성화되면 NEW 상태만 조회
      if (showNewOrdersOnly) {
        params.append("status", "NEW");
      } else if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }
      params.append("limit", "500");

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "주문 목록을 불러오는데 실패했습니다.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(err.message || "주문 목록을 불러오는 중 오류가 발생했습니다.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 제품별로 주문 그룹화 (매장별 통계 포함)
  const ordersByProduct = useMemo(() => {
    const grouped = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId;
        const productName = item.name;
        const productSku = item.sku || "";
        const storeId = order.store.id;
        const storeName = order.store.name;

        if (!grouped[productId]) {
          grouped[productId] = {
            productId,
            productName,
            productSku,
            orders: [],
            totalQuantity: 0,
            totalAmount: 0,
            statusCounts: {},
            stores: new Set(),
            storesData: {}, // 매장별 통계
          };
        }

        // 매장별 통계 초기화
        if (!grouped[productId].storesData[storeId]) {
          grouped[productId].storesData[storeId] = {
            storeId,
            storeName,
            orders: [],
            totalQuantity: 0,
            totalAmount: 0,
            statusCounts: {},
          };
        }

        const orderItem = {
          orderId: order.id,
          orderCode: order.orderCode || order.id,
          orderDate: order.orderedAt,
          store: order.store,
          status: order.statusCode,
          statusLabel: order.status,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        };

        grouped[productId].orders.push(orderItem);
        grouped[productId].totalQuantity += item.quantity;
        grouped[productId].totalAmount += item.quantity * item.unitPrice;
        grouped[productId].statusCounts[order.statusCode] =
          (grouped[productId].statusCounts[order.statusCode] || 0) + 1;
        grouped[productId].stores.add(order.store.id);

        // 매장별 통계 업데이트
        grouped[productId].storesData[storeId].orders.push(orderItem);
        grouped[productId].storesData[storeId].totalQuantity += item.quantity;
        grouped[productId].storesData[storeId].totalAmount += item.quantity * item.unitPrice;
        grouped[productId].storesData[storeId].statusCounts[order.statusCode] =
          (grouped[productId].storesData[storeId].statusCounts[order.statusCode] || 0) + 1;
      });
    });
    return grouped;
  }, [orders]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return Object.values(ordersByProduct);

    const query = searchQuery.toLowerCase();
    return Object.values(ordersByProduct).filter(
      (product) =>
        product.productName.toLowerCase().includes(query) ||
        product.productSku.toLowerCase().includes(query)
    );
  }, [ordersByProduct, searchQuery]);

  const toggleProduct = (productId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const toggleStore = (productId, storeId) => {
    const key = `${productId}-${storeId}`;
    setExpandedStores((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">주문 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 총 주문 수량과 금액으로 정렬
  const sortedProducts = [...filteredProducts].sort((a, b) => b.totalQuantity - a.totalQuantity);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">제품별 현황</h1>
        <p className="mt-1 text-sm text-slate-500">제품별 주문 내역과 통계를 확인할 수 있습니다.</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="제품명, SKU로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            {/* 신규주문 필터 - 맨 앞에 배치 */}
            <button
              type="button"
              title="주문 확인 전 상태의 신규 주문 전체"
              onClick={() => {
                setShowNewOrdersOnly(!showNewOrdersOnly);
                if (!showNewOrdersOnly) {
                  setSelectedStatus("all"); // 신규주문 필터 활성화 시 상태 필터 초기화
                }
              }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                showNewOrdersOnly
                  ? "border-yellow-400 bg-yellow-50 text-yellow-800 shadow-sm"
                  : "border-neutral-200 bg-white text-slate-700 hover:bg-neutral-50"
              }`}
            >
              <AlertCircle className={`h-4 w-4 ${showNewOrdersOnly ? "text-yellow-600" : "text-slate-400"}`} />
              신규주문
            </button>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              disabled={showNewOrdersOnly}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">전체 매장</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={showNewOrdersOnly}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">전체 상태</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          총 <span className="font-semibold text-slate-900">{sortedProducts.length}</span>개 제품
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* 제품별 주문 목록 */}
      <div className="space-y-4">
        {sortedProducts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-900">주문이 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">제품 주문 내역이 없습니다.</p>
          </div>
        ) : (
          sortedProducts.map((productData) => {
            const isExpanded = expandedProducts[productData.productId];

            return (
              <div key={productData.productId} className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                {/* 제품 헤더 */}
                <button
                  type="button"
                  onClick={() => toggleProduct(productData.productId)}
                  className="flex w-full items-center justify-between border-b border-neutral-100 p-4 text-left transition hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                    <Package className="h-5 w-5 text-[#967d5a]" />
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{productData.productName}</p>
                      {productData.productSku && (
                        <p className="mt-1 text-xs text-slate-500">SKU: {productData.productSku}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        주문 {productData.orders.length}건 · 매장 {productData.stores.size}개
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">총 주문 수량</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{productData.totalQuantity}개</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">총 주문 금액</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {currencyFormatter.format(productData.totalAmount)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map((status) => {
                        const count = productData.statusCounts[status.value] || 0;
                        if (count === 0) return null;
                        return (
                          <span
                            key={status.value}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                          >
                            {status.label} {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>

                {/* 주문 상세 목록 - 매장별로 그룹화 */}
                {isExpanded && (
                  <div className="p-4">
                    <div className="space-y-3">
                      {Object.values(productData.storesData).map((storeData) => {
                        const storeKey = `${productData.productId}-${storeData.storeId}`;
                        const isStoreExpanded = expandedStores[storeKey];

                        return (
                          <div
                            key={storeData.storeId}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden"
                          >
                            {/* 매장 헤더 */}
                            <button
                              type="button"
                              onClick={() => toggleStore(productData.productId, storeData.storeId)}
                              className="flex w-full items-center justify-between p-3 text-left transition hover:bg-neutral-100"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {isStoreExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                )}
                                <Store className="h-4 w-4 text-[#967d5a] flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-900">{storeData.storeName}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    주문 {storeData.orders.length}건 · 수량 {storeData.totalQuantity}개
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 ml-4">
                                <div className="text-right">
                                  <p className="text-xs text-slate-500">총 주문 금액</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-900">
                                    {currencyFormatter.format(storeData.totalAmount)}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {STATUS_OPTIONS.map((status) => {
                                    const count = storeData.statusCounts[status.value] || 0;
                                    if (count === 0) return null;
                                    return (
                                      <span
                                        key={status.value}
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                                      >
                                        {status.label} {count}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </button>

                            {/* 매장별 주문 목록 */}
                            {isStoreExpanded && (
                              <div className="border-t border-neutral-200 bg-white p-3">
                                <div className="space-y-2">
                                  {storeData.orders.map((orderItem, index) => {
                                    const status = STATUS_OPTIONS.find((s) => s.value === orderItem.status);

                                    return (
                                      <div
                                        key={`${orderItem.orderId}-${index}`}
                                        className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-900">
                                              주문 #{orderItem.orderCode || orderItem.orderId}
                                            </span>
                                            {status && (
                                              <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                                              >
                                                {status.label}
                                              </span>
                                            )}
                                          </div>
                                          <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                                            <span>{orderItem.orderDate}</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-slate-700">
                                            {orderItem.quantity}개 × {currencyFormatter.format(orderItem.unitPrice)}
                                          </p>
                                          <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {currencyFormatter.format(orderItem.totalPrice)}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
