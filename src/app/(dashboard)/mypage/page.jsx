"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { ORDER_STATUS_MAP } from "@/constants/orderStatus";
import { calculateOrderGrossTotal } from "@/utils/orderPrice";
import { formatCurrency } from "@/utils/formatCurrency";
import { useOrders } from "@/hooks/useOrders";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import OrderStatusBadge from "@/components/common/OrderStatusBadge";

const timeframeOptions = [
  { value: "all", label: "전체" },
  { value: "1m", label: "최근 1개월" },
  { value: "3m", label: "최근 3개월" },
  { value: "6m", label: "최근 6개월" },
  { value: "year", label: "올해" },
  { value: "custom", label: "직접 선택" },
];

const statusOptions = [
  { value: "ALL", label: "전체 상태" },
  { value: "NEW", label: ORDER_STATUS_MAP.NEW.label },
  { value: "PROCESSING", label: ORDER_STATUS_MAP.PROCESSING.label },
  { value: "SHIPPED", label: ORDER_STATUS_MAP.SHIPPED.label },
  { value: "DELIVERED", label: ORDER_STATUS_MAP.DELIVERED.label },
  { value: "CANCELLED", label: ORDER_STATUS_MAP.CANCELLED.label },
];

export default function MyPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [timeframe, setTimeframe] = useState("3m");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // useOrders 훅 사용
  const { orders, loading, error, refetch: fetchOrders } = useOrders({
    limit: 200,
  });

  useEffect(() => {
    if (timeframe !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  }, [timeframe]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders
      .filter((order) => {
        if (statusFilter !== "ALL" && order.statusCode !== statusFilter) {
          return false;
        }

        if (search) {
          const keyword = search.trim().toLowerCase();
          const orderNumber = String(order.orderCode || order.id || "");
          const matchOrderId = orderNumber.toLowerCase().includes(keyword);
          const matchProduct = (order.items || []).some((item) =>
            (item.name || "").toLowerCase().includes(keyword)
          );
          if (!matchOrderId && !matchProduct) {
            return false;
          }
        }

        if (timeframe === "all") {
          return true;
        }

        const orderDate = parseOrderDate(order.orderedAt);
        if (!orderDate) {
          return true;
        }

        const diff = now - orderDate;

        if (timeframe === "custom") {
          if (!startDate && !endDate) {
            return true;
          }
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          if (start) {
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) {
              return false;
            }
          }
          if (end) {
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) {
              return false;
            }
          }
          return true;
        }

        switch (timeframe) {
          case "1m":
            return diff <= 1000 * 60 * 60 * 24 * 30;
          case "3m":
            return diff <= 1000 * 60 * 60 * 24 * 90;
          case "6m":
            return diff <= 1000 * 60 * 60 * 24 * 180;
          case "year":
            return now.getFullYear() === orderDate.getFullYear();
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const dateA = parseOrderDate(a.orderedAt)?.getTime() || 0;
        const dateB = parseOrderDate(b.orderedAt)?.getTime() || 0;
        return dateB - dateA;
      });
  }, [orders, statusFilter, timeframe, search]);

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const orderGrossTotal = calculateOrderGrossTotal(order);
        acc.total += 1;
        acc.amount += orderGrossTotal;
        acc[order.statusCode] = (acc[order.statusCode] || 0) + 1;
        return acc;
      },
      { total: 0, amount: 0 }
    );
  }, [orders]);

  const toggleOrder = (orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner message="주문 내역을 불러오는 중..." />;
  }

  return (
    <div className="flex-1 bg-neutral-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8">
        <div>
          <p className="text-sm font-medium text-[#967d5a]">내 계정</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">내 페이지</h1>
          <p className="mt-1 text-sm text-slate-500">
            주문 현황을 필터링하고 세부 품목까지 즉시 확인할 수 있습니다.
          </p>
        </div>

        <ErrorMessage message={error} onRetry={fetchOrders} />

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <SummaryCard title="총 주문" value={`${summary.total}건`} />
          <SummaryCard title="총 주문 금액" value={formatCurrency(summary.amount)} />
          <SummaryCard title="입금대기" value={`${summary.NEW || 0}건`} tone="warning" />
          <SummaryCard title="배송완료" value={`${summary.DELIVERED || 0}건`} tone="success" />
          <SummaryCard title="주문확인" value={`${summary.PROCESSING || 0}건`} />
          <SummaryCard title="배송중" value={`${summary.SHIPPED || 0}건`} />
          <SummaryCard title="취소됨" value={`${summary.CANCELLED || 0}건`} tone="danger" />
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="상태"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
              <FilterSelect
                label="기간"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                options={timeframeOptions}
              />
            </div>
            <div className="flex w-full items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-slate-500 lg:w-72">
              <Filter className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="주문번호 또는 상품명 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {timeframe === "custom" && (
            <div className="mt-4 flex flex-wrap items-end gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-4 text-sm">
              <DateInput
                label="시작일"
                value={startDate}
                onChange={(value) => setStartDate(value)}
              />
              <DateInput
                label="종료일"
                value={endDate}
                onChange={(value) => setEndDate(value)}
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:text-[#967d5a]"
                >
                  <XCircle className="h-4 w-4" />
                  초기화
                </button>
              )}
            </div>
          )}

          <div className="mt-6 divide-y divide-neutral-100">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                조건에 해당하는 주문이 없습니다.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <article key={order.id} className="py-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-400">주문번호</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {order.orderCode || order.id}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {order.orderedAt}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{order.items?.length || 0}개 품목</span>
                        <span className="text-slate-300">•</span>
                        <span>{order.store?.name || "매장 정보 없음"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">결제 예정 금액</p>
                        <p className="text-base font-semibold text-slate-900">
                          {formatCurrency(calculateOrderGrossTotal(order))}
                        </p>
                      </div>
                      <StatusPill statusCode={order.statusCode} statusTone={order.statusTone} />
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {expandedOrder === order.id && (
                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-slate-600">
                      <div className="grid gap-4 md:grid-cols-2">
                        <DetailRow label="배송 예정일" value={order.deliveryDate} icon={Truck} />
                        <DetailRow label="결제 상태" value={getPaymentLabel(order.paymentStatus)} icon={Package} />
                      </div>

                      <div className="mt-4 rounded-2xl border border-neutral-100 bg-white">
                        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 text-xs font-semibold text-slate-400">
                          <span>상품 정보</span>
                          <span>수량 · 금액</span>
                        </div>
                        <ul className="divide-y divide-neutral-100">
                          {(order.items || []).map((item) => (
                            <li key={item.id} className="flex items-center justify-between px-4 py-3">
                              <div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-400">SKU {item.sku || "-"}</p>
                              </div>
                              <div className="text-right text-sm font-semibold text-slate-900">
                                <p>수량 {item.quantity}</p>
                                <p className="text-xs text-slate-500">
                                  {formatCurrency(item.unitPrice)} / EA
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-sm font-semibold">
                          <span>합계</span>
                          <span className="text-[#967d5a]">
                            {formatCurrency(calculateOrderGrossTotal(order))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, tone }) {
  const toneClass = {
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-600",
    default: "text-slate-900",
  }[tone || "default"];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col text-xs font-medium text-slate-500">
      {label}
      <select
        value={value}
        onChange={onChange}
        className="mt-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#967d5a] focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPill({ statusCode, statusTone }) {
  const label = ORDER_STATUS_MAP[statusCode]?.label || statusCode;
  const toneClass = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    info: "bg-blue-50 text-blue-700 border-blue-100",
  }[statusTone] || "bg-neutral-100 text-slate-600 border-neutral-200";

  return (
    <span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {label}
    </span>
  );
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3">
      <Icon className="h-4 w-4 text-[#967d5a]" />
      <div className="text-xs">
        <p className="font-medium text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value || "정보 없음"}</p>
      </div>
    </div>
  );
}

function parseOrderDate(dateString) {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function getPaymentLabel(paymentStatus) {
  switch (paymentStatus) {
    case "PENDING":
      return "결제 대기";
    case "PAID":
      return "결제 완료";
    case "FAILED":
      return "결제 실패";
    default:
      return paymentStatus || "확인 필요";
  }
}

function DateInput({ label, value, onChange }) {
  return (
    <label className="flex flex-col text-xs font-medium text-slate-500">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-44 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-[#967d5a] focus:outline-none"
      />
    </label>
  );
}


