"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, Calendar, Store, Edit, AlertCircle, Filter } from "lucide-react";
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
];

export default function NewOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("all");
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: "",
    paymentStatus: "",
    deliveryDate: "",
  });
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchFranchises();
    fetchStores();
    fetchProducts();
    fetchNewOrders();
  }, []);

  useEffect(() => {
    fetchNewOrders();
  }, [selectedFranchiseId, selectedStoreId, selectedProductId, selectedPaymentStatus]);

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

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?isActive=true");
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [selectedFranchiseId]);

  const fetchNewOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.append("status", "NEW");
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
        throw new Error(data.error || "신규 주문 목록을 불러오는데 실패했습니다.");
      }

      let filteredOrders = data.orders || [];

      // 제품별 필터링 (클라이언트 사이드)
      if (selectedProductId !== "all") {
        filteredOrders = filteredOrders.filter((order) =>
          order.items.some((item) => item.productId === selectedProductId)
        );
      }

      // 결제 상태별 필터링 (클라이언트 사이드)
      if (selectedPaymentStatus !== "all") {
        filteredOrders = filteredOrders.filter((order) => order.paymentStatus === selectedPaymentStatus);
      }

      setOrders(filteredOrders);
    } catch (err) {
      console.error("Fetch new orders error:", err);
      setError(err.message || "신규 주문 목록을 불러오는 중 오류가 발생했습니다.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
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
      await fetchNewOrders();
    } catch (err) {
      console.error("Update order error:", err);
      alert(err.message || "주문 수정 중 오류가 발생했습니다.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">신규 주문 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const totalAmount = orders.reduce((sum, order) => sum + calculateOrderGrossTotal(order), 0);
  const totalQuantity = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">신규주문 현황</h1>
        <p className="mt-1 text-sm text-slate-500">입금대기 상태의 신규 주문을 확인하고 관리할 수 있습니다.</p>
        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm font-medium text-yellow-800">
            <span className="font-semibold">신규주문 기준:</span> 주문 확인 전 상태(NEW)의 모든 주문
          </p>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedFranchiseId}
            onChange={(e) => {
              setSelectedFranchiseId(e.target.value);
              setSelectedStoreId("all");
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          >
            <option value="all">전체 가맹점</option>
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
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          >
            <option value="all">전체 제품</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          >
            <option value="all">전체 결제 상태</option>
            {PAYMENT_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-slate-500">
          총 <span className="font-semibold text-slate-900">{orders.length}</span>건
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">신규 주문 건수</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{orders.length}건</p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">총 주문 수량</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totalQuantity}개</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">총 주문 금액</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{currencyFormatter.format(totalAmount)}</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* 신규 주문 목록 */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-900">신규 주문이 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">입금대기 상태의 주문이 없습니다.</p>
          </div>
        ) : (
          orders.map((order) => {
            const orderNumber = order.orderCode || order.id;
            const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const isEditing = editingOrder?.id === order.id;

            return (
              <div key={order.id} className="rounded-2xl border border-yellow-200 bg-yellow-50 shadow-sm">
                <div className="flex items-center justify-between border-b border-yellow-200 p-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">주문 #{orderNumber}</span>
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          입금대기
                        </span>
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
                        onClick={() => handleEditOrder(order)}
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
                  <div className="border-b border-yellow-200 bg-yellow-100/50 p-4">
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

                {/* 주문 품목 */}
                <div className="p-4">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-yellow-200 bg-white p-3"
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
                  <div className="mt-4 flex justify-between border-t border-yellow-200 pt-4">
                    <div />
                    <div className="text-right">
                      <p className="text-sm text-slate-500">총 주문 금액</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        {currencyFormatter.format(calculateOrderGrossTotal(order))}
                      </p>
                    </div>
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
