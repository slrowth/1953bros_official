"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Package, Truck, Store, Calendar, Filter } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

const ITEM_STATUS_OPTIONS = [
  { value: "all", label: "전체 상태" },
  { value: "PENDING", label: "대기중" },
  { value: "ALLOCATED", label: "배정완료" },
  { value: "SHIPPED", label: "배송완료" },
  { value: "CANCELLED", label: "취소됨" },
];

export default function PendingShipmentPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemStatusFilter, setItemStatusFilter] = useState("all");

  useEffect(() => {
    fetchPendingShipmentOrders();
  }, []);

  // 배송완료(DELIVERED)가 아닌 모든 주문 가져오기
  const fetchPendingShipmentOrders = async () => {
    try {
      setLoading(true);
      setError("");

      // DELIVERED가 아닌 모든 상태의 주문 가져오기
      const statuses = ["NEW", "PROCESSING", "SHIPPED", "CANCELLED"];
      const allOrders = [];

      // 각 상태별로 주문 가져오기
      for (const status of statuses) {
        const params = new URLSearchParams();
        params.append("status", status);
        params.append("limit", "500");

        const response = await fetch(`/api/orders?${params.toString()}`);
        const data = await response.json();

        if (response.ok && data.orders) {
          allOrders.push(...data.orders);
        }
      }

      setOrders(allOrders);
    } catch (err) {
      console.error("Fetch pending shipment orders error:", err);
      setError(err.message || "발송대기 주문 목록을 불러오는 중 오류가 발생했습니다.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 배송완료되지 않은 주문의 모든 품목 추출
  const allItems = useMemo(() => {
    const items = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        items.push({
          ...item,
          orderId: order.id,
          orderCode: order.orderCode || order.id,
          orderDate: order.orderedAt,
          deliveryDate: order.deliveryDate,
          store: order.store,
          orderStatusCode: order.statusCode,
        });
      });
    });
    return items;
  }, [orders]);

  // 상태 필터 및 검색 필터 적용
  const filteredItems = useMemo(() => {
    let filtered = allItems;

    // 상태 필터 적용
    if (itemStatusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === itemStatusFilter);
    }

    // 검색 필터 적용
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const orderNumber = (item.orderCode || item.orderId || "").toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.sku?.toLowerCase().includes(query) ||
          orderNumber.includes(query) ||
          item.store.name.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [allItems, itemStatusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">발송대기 주문 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = filteredItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">발송대기 제품 현황</h1>
        <p className="mt-1 text-sm text-slate-500">배송완료 처리되지 않은 주문의 제품을 확인하고 상태별로 필터링할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">발송대기 제품 수</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{filteredItems.length}건</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">총 수량</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totalQuantity}개</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">총 금액</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{currencyFormatter.format(totalAmount)}</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="제품명, SKU, 주문 ID, 매장명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={itemStatusFilter}
            onChange={(e) => setItemStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          >
            {ITEM_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* 발송대기 제품 목록 */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <Truck className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-900">발송대기 제품이 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">발송 대기 중인 제품이 없습니다.</p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const getStatusInfo = (status) => {
              switch (status) {
                case "ALLOCATED":
                  return { color: "bg-blue-100 text-blue-800", label: "배정완료" };
                case "SHIPPED":
                  return { color: "bg-green-100 text-green-800", label: "배송완료" };
                case "CANCELLED":
                  return { color: "bg-red-100 text-red-800", label: "취소됨" };
                case "PENDING":
                default:
                  return { color: "bg-yellow-100 text-yellow-800", label: "대기중" };
              }
            };
            const statusInfo = getStatusInfo(item.status);

            return (
              <div key={`${item.orderId}-${item.id}-${index}`} className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-neutral-100 p-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {item.sku && <p className="mt-1 text-xs text-slate-500">SKU: {item.sku}</p>}
                      <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          주문 #{item.orderCode || item.orderId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {item.store.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.orderDate}
                        </span>
                        {item.deliveryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            납품예정: {item.deliveryDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-700">
                      {item.quantity}개 × {currencyFormatter.format(item.unitPrice)}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {currencyFormatter.format(item.quantity * item.unitPrice)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
