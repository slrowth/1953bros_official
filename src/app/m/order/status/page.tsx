/**
 * 모바일 주문현황 페이지
 * 주문 목록 조회 및 상세
 */
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, RefreshCw, Calendar, Package, Store, X } from "lucide-react";
import MobileLayout from "@/components/mobile/MobileLayout";
import { useOrders } from "@/hooks/useOrders";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import OrderStatusBadge from "@/components/common/OrderStatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";
import { calculateOrderGrossTotal } from "@/utils/orderPrice";

function MobileOrderStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [pullToRefreshY, setPullToRefreshY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { orders, loading, error, refetch } = useOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 100,
  });

  const selectedOrderId = searchParams.get("orderId");

  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      if (deltaY > 0 && window.scrollY === 0) {
        setPullToRefreshY(Math.min(deltaY, 100));
      }
    };

    const handleTouchEnd = async () => {
      if (pullToRefreshY > 50) {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
      }
      setPullToRefreshY(0);
      setIsPulling(false);
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, pullToRefreshY, refetch]);

  const filteredOrders = useMemo(() => {
    return [...orders].sort((a: any, b: any) => {
      const dateA = new Date(a.orderedAt);
      const dateB = new Date(b.orderedAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [orders]);

  const handleOrderClick = (orderId: string) => {
    const order = filteredOrders.find((o: any) => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
    }
  };

  return (
    <MobileLayout
      title="주문현황"
      headerRightAction={
        <button
          onClick={refetch}
          disabled={loading || refreshing}
          className="flex h-11 w-11 items-center justify-center rounded-lg transition hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-50"
          aria-label="새로고침"
        >
          <RefreshCw
            className={`h-5 w-5 text-slate-700 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      }
      headerBottomContent={
        <div className="px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: "all", label: "전체" },
              { value: "NEW", label: "입금대기" },
              { value: "PROCESSING", label: "주문확인" },
              { value: "SHIPPED", label: "배송중" },
              { value: "DELIVERED", label: "배송완료" },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  statusFilter === status.value
                    ? "bg-[#967d5a] text-white"
                    : "bg-neutral-100 text-slate-700 active:bg-neutral-200"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="flex flex-col">
        {pullToRefreshY > 0 && (
          <div
            className="flex items-center justify-center border-b border-neutral-200 bg-white py-4"
            style={{ transform: `translateY(${pullToRefreshY}px)` }}
          >
            <RefreshCw
              className={`h-5 w-5 text-[#967d5a] ${pullToRefreshY > 50 ? "animate-spin" : ""}`}
            />
          </div>
        )}

        {loading && !refreshing ? (
          <LoadingSpinner message="주문 내역을 불러오는 중..." />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={refetch} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-900">주문 내역이 없습니다</p>
            <p className="mt-1 text-xs text-slate-500">
              {statusFilter !== "all" ? "해당 상태의 주문이 없습니다" : "주문을 시작해보세요"}
            </p>
          </div>
        ) : (
          <div className="px-4 pt-4 pb-4 space-y-3">
            {filteredOrders.map((order: any) => {
              const totalQuantity = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
              const totalAmount = calculateOrderGrossTotal(order);

              return (
                <button
                  key={order.id}
                  onClick={() => handleOrderClick(order.id)}
                  className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition active:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {order.orderCode || order.id}
                        </p>
                        <OrderStatusBadge status={order.statusCode} size="small" />
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateTime(order.orderedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          <span>{order.store?.name || "매장 정보 없음"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>{order.items?.length || 0}종 · {totalQuantity}개</span>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {order.items.slice(0, 2).map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-lg bg-neutral-50 px-2 py-1.5 text-xs"
                            >
                              <span className="text-slate-700">{item.name}</span>
                              <span className="text-slate-500">
                                {item.quantity}개 × {formatCurrency(item.unitPrice)}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="px-2 text-xs text-slate-400">
                              외 {order.items.length - 2}개 품목
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
                      <ChevronRight className="mt-2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedOrder && (
          <div 
            className="fixed inset-0 z-[60] bg-black/50" 
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0))' }}
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white p-4 z-10">
                <h3 className="text-lg font-semibold text-slate-900">주문내역</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition active:bg-neutral-100"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              <div className="p-4 pb-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {selectedOrder.orderCode || selectedOrder.id}
                      </p>
                      <OrderStatusBadge status={selectedOrder.statusCode} size="small" />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{selectedOrder.orderedAt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-slate-400" />
                      <span>{selectedOrder.store?.name || "매장 정보 없음"}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-900">주문 품목</h4>
                  <div className="space-y-2">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">{item.name}</p>
                            {item.sku && (
                              <p className="mt-0.5 text-xs text-slate-500">SKU: {item.sku}</p>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {item.quantity}개 × {formatCurrency(item.unitPrice)}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-[#967d5a]">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">주문 품목이 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-slate-900">총 주문 금액</p>
                    <p className="text-xl font-bold text-[#967d5a]">
                      {formatCurrency(calculateOrderGrossTotal(selectedOrder))}
                    </p>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4 pb-2">
                  <p className="text-xs font-medium text-red-600 leading-relaxed">
                    *주문 수정과 취소는 김철민과장(010-7193-9303)께 별도 연락 바랍니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default function MobileOrderStatusPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="로딩 중..." />}>
      <MobileOrderStatusContent />
    </Suspense>
  );
}