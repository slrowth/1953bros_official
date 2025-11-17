"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, Store, Building2, Package, TrendingUp } from "lucide-react";

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

// 주문 상태 정렬 순서
const STATUS_ORDER = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

// 주문을 상태별로 정렬하는 함수
const sortOrdersByStatus = (orders) => {
  return [...orders].sort((a, b) => {
    const aIndex = STATUS_ORDER.indexOf(a.statusCode);
    const bIndex = STATUS_ORDER.indexOf(b.statusCode);
    // 상태 순서에 따라 정렬, 같은 상태면 주문일 기준 내림차순
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return new Date(b.orderedAt) - new Date(a.orderedAt);
  });
};

export default function OrdersByStorePage() {
  const [orders, setOrders] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("all");
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [expandedFranchises, setExpandedFranchises] = useState({});
  const [expandedStores, setExpandedStores] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    fetchFranchises();
    fetchStores();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [selectedFranchiseId, selectedStoreId]);

  const fetchFranchises = async () => {
    try {
      const response = await fetch("/api/franchises");
      const data = await response.json();
      if (response.ok) {
        setFranchises(data.franchises || []);
      }
    } catch (err) {
      console.error("Fetch franchises error:", err);
    }
  };

  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      params.append("isActive", "true");
      if (selectedFranchiseId !== "all") {
        params.append("franchiseId", selectedFranchiseId);
      }

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
      if (selectedFranchiseId !== "all") {
        params.append("franchiseId", selectedFranchiseId);
      }
      if (selectedStoreId !== "all") {
        params.append("storeId", selectedStoreId);
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

  useEffect(() => {
    fetchStores();
  }, [selectedFranchiseId]);

  // 프랜차이즈별로 주문 그룹화
  const ordersByFranchise = useMemo(() => {
    const grouped = {};
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1주일 전

    orders.forEach((order) => {
      const franchiseId = order.store.franchiseId;
      const franchiseName = order.store.franchiseName || "알 수 없음";
      if (!grouped[franchiseId]) {
        grouped[franchiseId] = {
          franchiseId,
          franchiseName,
          stores: {},
          totalOrders: 0,
          totalAmount: 0,
          statusCounts: {},
          newOrdersCount: 0, // 1주일 이내 신규주문
        };
      }
      const storeId = order.store.id;
      const storeName = order.store.name;
      if (!grouped[franchiseId].stores[storeId]) {
        grouped[franchiseId].stores[storeId] = {
          storeId,
          storeName,
          orders: [],
          totalOrders: 0,
          totalAmount: 0,
          statusCounts: {},
          newOrdersCount: 0, // 1주일 이내 신규주문
        };
      }
      grouped[franchiseId].stores[storeId].orders.push(order);
      grouped[franchiseId].stores[storeId].totalOrders++;
      grouped[franchiseId].stores[storeId].totalAmount += order.totalAmount;
      grouped[franchiseId].stores[storeId].statusCounts[order.statusCode] =
        (grouped[franchiseId].stores[storeId].statusCounts[order.statusCode] || 0) + 1;

      // 1주일 이내 신규주문 체크
      const orderDate = new Date(order.orderedAt);
      if (orderDate >= oneWeekAgo) {
        grouped[franchiseId].stores[storeId].newOrdersCount++;
        grouped[franchiseId].newOrdersCount++;
      }

      grouped[franchiseId].totalOrders++;
      grouped[franchiseId].totalAmount += order.totalAmount;
      grouped[franchiseId].statusCounts[order.statusCode] =
        (grouped[franchiseId].statusCounts[order.statusCode] || 0) + 1;
    });
    return grouped;
  }, [orders]);

  const toggleFranchise = (franchiseId) => {
    setExpandedFranchises((prev) => ({
      ...prev,
      [franchiseId]: !prev[franchiseId],
    }));
  };

  const toggleStore = (franchiseId, storeId) => {
    const key = `${franchiseId}-${storeId}`;
    setExpandedStores((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
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

  const franchiseList = Object.values(ordersByFranchise);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">가맹점별 주문현황</h1>
        <p className="mt-1 text-sm text-slate-500">프랜차이즈와 매장별로 주문 현황을 확인할 수 있습니다.</p>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <select
            value={selectedFranchiseId}
            onChange={(e) => {
              setSelectedFranchiseId(e.target.value);
              setSelectedStoreId("all");
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          >
            <option value="all">전체 프랜차이즈</option>
            {franchises.map((franchise) => (
              <option key={franchise.id} value={franchise.id}>
                {franchise.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          >
            <option value="all">전체 매장</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-slate-500">
          총 <span className="font-semibold text-slate-900">{orders.length}</span>건
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* 프랜차이즈별 주문 현황 */}
      <div className="space-y-4">
        {franchiseList.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-900">주문이 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">선택한 조건에 해당하는 주문이 없습니다.</p>
          </div>
        ) : (
          franchiseList.map((franchiseData) => {
            const isFranchiseExpanded = expandedFranchises[franchiseData.franchiseId];
            const storeList = Object.values(franchiseData.stores);

            return (
              <div key={franchiseData.franchiseId} className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                {/* 프랜차이즈 헤더 */}
                <button
                  type="button"
                  onClick={() => toggleFranchise(franchiseData.franchiseId)}
                  className="flex w-full items-center justify-between border-b border-neutral-100 p-4 text-left transition hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-4">
                    {isFranchiseExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                    <Building2 className="h-5 w-5 text-[#967d5a]" />
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{franchiseData.franchiseName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        매장 {storeList.length}개 · 주문 {franchiseData.totalOrders}건
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">총 주문 금액</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {currencyFormatter.format(franchiseData.totalAmount)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* 신규주문건수 (1주일 이내) */}
                      {franchiseData.newOrdersCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          신규주문 {franchiseData.newOrdersCount}건
                        </span>
                      )}
                      {/* 상태별 건수 */}
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map((status) => {
                          const count = franchiseData.statusCounts[status.value] || 0;
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
                  </div>
                </button>

                {/* 매장별 주문 목록 */}
                {isFranchiseExpanded && (
                  <div className="divide-y divide-neutral-100">
                    {storeList.map((storeData) => {
                      const storeKey = `${franchiseData.franchiseId}-${storeData.storeId}`;
                      const isStoreExpanded = expandedStores[storeKey];

                      return (
                        <div key={storeData.storeId} className="bg-neutral-50">
                          <button
                            type="button"
                            onClick={() => toggleStore(franchiseData.franchiseId, storeData.storeId)}
                            className="flex w-full items-center justify-between p-4 text-left transition hover:bg-neutral-100"
                          >
                            <div className="flex items-center gap-4">
                              {isStoreExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                              <Store className="h-4 w-4 text-slate-500" />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{storeData.storeName}</p>
                                <p className="mt-1 text-xs text-slate-500">주문 {storeData.totalOrders}건</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-xs text-slate-500">총 주문 금액</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {currencyFormatter.format(storeData.totalAmount)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {/* 신규주문건수 (1주일 이내) */}
                                {storeData.newOrdersCount > 0 && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                                    신규주문 {storeData.newOrdersCount}건
                                  </span>
                                )}
                                {/* 상태별 건수 */}
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
                            </div>
                          </button>

                          {/* 주문 상세 목록 */}
                          {isStoreExpanded && (
                            <div className="border-t border-neutral-200 bg-white p-4">
                              <div className="space-y-2">
                                {sortOrdersByStatus(storeData.orders).map((order) => {
                                  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                                  const status = STATUS_OPTIONS.find((s) => s.value === order.statusCode);
                                  const isOrderExpanded = expandedOrders[order.id];

                                  return (
                                    <div
                                      key={order.id}
                                      className="rounded-lg border border-neutral-200 bg-white overflow-hidden"
                                    >
                                      {/* 주문 헤더 - 클릭 가능 */}
                                      <button
                                        type="button"
                                        onClick={() => toggleOrder(order.id)}
                                        className="flex w-full items-center justify-between p-3 text-left transition hover:bg-neutral-50"
                                      >
                                        <div className="flex items-center gap-3 flex-1">
                                          {isOrderExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                          )}
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-medium text-slate-900">
                                                주문 #{order.id.slice(0, 8)}
                                              </span>
                                              {status && (
                                                <span
                                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                                                >
                                                  {status.label}
                                                </span>
                                              )}
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                              {order.orderedAt} · 제품 {order.items.length}종 · 수량 {totalQuantity}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="text-sm font-semibold text-slate-900">
                                            {currencyFormatter.format(order.totalAmount)}
                                          </p>
                                        </div>
                                      </button>

                                      {/* 주문 품목 상세 */}
                                      {isOrderExpanded && (
                                        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
                                          <div className="space-y-2">
                                            {order.items.map((item) => (
                                              <div
                                                key={item.id}
                                                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
                                              >
                                                <div className="flex-1">
                                                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                                  {item.sku && <p className="mt-1 text-xs text-slate-500">SKU: {item.sku}</p>}
                                                </div>
                                                <div className="text-right">
                                                  <p className="text-sm text-slate-700">
                                                    {item.quantity}개 × {currencyFormatter.format(item.unitPrice)}
                                                  </p>
                                                  <p className="mt-1 text-sm font-semibold text-slate-900">
                                                    {currencyFormatter.format(item.quantity * item.unitPrice)}
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4">
                                            <div className="text-sm text-slate-500">
                                              <p>부가세: {currencyFormatter.format(order.vatAmount)}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm text-slate-500">총 주문 금액</p>
                                              <p className="mt-1 text-lg font-semibold text-slate-900">
                                                {currencyFormatter.format(order.totalAmount)}
                                              </p>
                                            </div>
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
                    })}
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
