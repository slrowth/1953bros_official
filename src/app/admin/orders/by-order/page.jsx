"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, Edit, Calendar, Package, Store, Filter, ArrowUpDown } from "lucide-react";
import { calculateOrderGrossTotal } from "@/utils/orderPrice";

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

const PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "대기중", color: "bg-gray-100 text-gray-800" },
  { value: "PAID", label: "결제완료", color: "bg-green-100 text-green-800" },
  { value: "FAILED", label: "결제실패", color: "bg-red-100 text-red-800" },
  { value: "REFUNDED", label: "환불됨", color: "bg-orange-100 text-orange-800" },
];

export default function OrdersByOrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"
  const [expandedOrders, setExpandedOrders] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: "",
    paymentStatus: "",
    deliveryDate: "",
  });
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("limit", "100");

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

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // 검색 필터 적용
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderNumber = (order.orderCode || order.id || "").toLowerCase();
        return (
          orderNumber.includes(query) ||
          order.store.name.toLowerCase().includes(query) ||
          order.items.some((item) => item.name.toLowerCase().includes(query))
        );
      });
    }

    // 날짜 정렬 적용
    const sorted = [...filtered].sort((a, b) => {
      // orderedAt 문자열을 Date 객체로 변환
      const dateA = new Date(a.orderedAt);
      const dateB = new Date(b.orderedAt);
      
      if (sortOrder === "asc") {
        return dateA - dateB; // 오름차순 (과거 → 최신)
      } else {
        return dateB - dateA; // 내림차순 (최신 → 과거)
      }
    });

    return sorted;
  }, [orders, searchQuery, sortOrder]);

  const toggleOrder = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setEditFormData({
      status: order.statusCode,
      paymentStatus: order.paymentStatus,
      deliveryDate: order.deliveryDate || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditFormData({
      status: "",
      paymentStatus: "",
      deliveryDate: "",
    });
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      setUpdatingOrderId(editingOrder.id);

      const updateData = {};
      if (editFormData.status !== editingOrder.statusCode) {
        updateData.status = editFormData.status;
      }
      if (editFormData.paymentStatus !== editingOrder.paymentStatus) {
        updateData.paymentStatus = editFormData.paymentStatus;
      }
      if (editFormData.deliveryDate !== editingOrder.deliveryDate) {
        updateData.deliveryDate = editFormData.deliveryDate || null;
      }

      if (Object.keys(updateData).length === 0) {
        alert("변경된 내용이 없습니다.");
        return;
      }

      const response = await fetch(`/api/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "주문 수정에 실패했습니다.");
      }

      alert("주문이 수정되었습니다.");
      handleCancelEdit();
      await fetchOrders();
    } catch (err) {
      console.error("Update order error:", err);
      alert(err.message || "주문 수정 중 오류가 발생했습니다.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (statusCode) => {
    const status = STATUS_OPTIONS.find((s) => s.value === statusCode);
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.color || "bg-gray-100 text-gray-800"}`}
      >
        {status?.label || statusCode}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const status = PAYMENT_STATUS_OPTIONS.find((s) => s.value === paymentStatus);
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.color || "bg-gray-100 text-gray-800"}`}
      >
        {status?.label || paymentStatus}
      </span>
    );
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

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">주문건별 현황</h1>
        <p className="mt-1 text-sm text-slate-500">모든 주문을 확인하고 상태를 관리할 수 있습니다.</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="주문 ID, 매장명, 제품명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            >
              <option value="all">전체 상태</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
              title={sortOrder === "desc" ? "최신순 (내림차순)" : "과거순 (오름차순)"}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "desc" ? "최신순" : "과거순"}
            </button>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          총 <span className="font-semibold text-slate-900">{filteredOrders.length}</span>건
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* 주문 목록 */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-900">주문이 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">주문 내역이 없습니다.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const orderNumber = order.orderCode || order.id;
            const isExpanded = expandedOrders[order.id];
            const isEditing = editingOrder?.id === order.id;
            const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div key={order.id} className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                {/* 주문 헤더 */}
                <div 
                  className="flex items-center justify-between border-b border-neutral-100 p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">주문 #{orderNumber}</span>
                        {getStatusBadge(order.statusCode)}
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {order.store.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          주문일: {order.orderedAt}
                        </span>
                        {order.deliveryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            납품예정: {order.deliveryDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">제품 {order.items.length}종 · 수량 {totalQuantity}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {currencyFormatter.format(calculateOrderGrossTotal(order))}
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrder(order);
                        }}
                        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                      >
                        <Edit className="h-4 w-4" />
                        수정
                      </button>
                    )}
                  </div>
                </div>

                {/* 주문 수정 폼 */}
                {isEditing && (
                  <div 
                    className="border-b border-neutral-100 bg-neutral-50 p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">주문 상태</label>
                        <select
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">결제 상태</label>
                        <select
                          value={editFormData.paymentStatus}
                          onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                        >
                          {PAYMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">납품예정일</label>
                        <input
                          type="date"
                          value={editFormData.deliveryDate}
                          onChange={(e) => setEditFormData({ ...editFormData, deliveryDate: e.target.value })}
                          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateOrder}
                        disabled={updatingOrderId === order.id}
                        className="rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548] disabled:opacity-50"
                      >
                        {updatingOrderId === order.id ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 주문 품목 상세 */}
                {isExpanded && (
                  <div className="p-4">
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3"
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
                      <div />
                      <div className="text-right">
                        <p className="text-sm text-slate-500">총 주문 금액</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {currencyFormatter.format(calculateOrderGrossTotal(order))}
                        </p>
                      </div>
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
