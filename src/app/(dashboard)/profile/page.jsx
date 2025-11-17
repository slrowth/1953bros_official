"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  UserCircle2,
} from "lucide-react";
import { ORDER_STATUS_MAP } from "@/constants/orderStatus";
import { createClient } from "@/lib/supabase/client";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [franchiseInfo, setFranchiseInfo] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError("");

      const supabase = createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser) {
        setError("로그인이 필요합니다.");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error(profileError.message || "프로필 정보를 불러올 수 없습니다.");
      }

      setUserInfo({
        ...profileData,
        email: authUser.email,
        lastSignInAt: authUser.last_sign_in_at,
      });

      if (profileData?.store_id || profileData?.store_name) {
        const storeQuery = supabase
          .from("stores")
          .select("*")
          .eq(profileData.store_id ? "id" : "name", profileData.store_id || profileData.store_name)
          .maybeSingle();

        const [{ data: storeData, error: storeError }] = await Promise.all([storeQuery]);

        if (storeError) {
          console.warn("Store fetch error:", storeError);
        } else {
          setStoreInfo(storeData);

          if (storeData?.franchise_id) {
            const { data: franchiseData } = await supabase
              .from("franchises")
              .select("*")
              .eq("id", storeData.franchise_id)
              .maybeSingle();
            if (franchiseData) {
              setFranchiseInfo(franchiseData);
            }
          }
        }
      }

      const ordersResponse = await fetch("/api/orders?limit=100");
      const ordersJson = await ordersResponse.json();

      if (!ordersResponse.ok) {
        throw new Error(ordersJson.error || "주문 내역을 불러올 수 없습니다.");
      }

      setOrders(ordersJson.orders || []);
    } catch (err) {
      console.error("Profile page error:", err);
      setError(err.message || "프로필 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const orderSummary = useMemo(() => {
    if (!orders.length) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalAmount: 0,
      };
    }

    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        acc.totalAmount += Number(order.totalAmount || 0);
        switch (order.statusCode) {
          case "NEW":
            acc.pending += 1;
            break;
          case "PROCESSING":
            acc.processing += 1;
            break;
          case "SHIPPED":
            acc.shipped += 1;
            break;
          case "DELIVERED":
            acc.delivered += 1;
            break;
          case "CANCELLED":
            acc.cancelled += 1;
            break;
          default:
            break;
        }
        return acc;
      },
      {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalAmount: 0,
      }
    );
  }, [orders]);

  const latestOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const statusDisplay = (statusCode) => ORDER_STATUS_MAP[statusCode]?.label || statusCode;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-[#967d5a]" />
          <p>프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8">
        <div>
          <p className="text-sm font-medium text-[#967d5a]">계정</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">프로필</h1>
          <p className="mt-1 text-sm text-slate-500">
            계정 정보, 연락처, 매장 정보를 확인하고 활동 현황을 한눈에 살펴보세요.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#967d5a]/10">
                    <UserCircle2 className="h-8 w-8 text-[#967d5a]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">계정 소유자</p>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      {userInfo?.name || "이름 정보 없음"}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-slate-600">
                        {getRoleLabel(userInfo?.role)}
                      </span>
                      <span className={`rounded-full px-3 py-1 ${getStatusTone(userInfo?.status)}`}>
                        {getStatusLabel(userInfo?.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    가입일{" "}
                    <span className="font-semibold text-slate-900">
                      {formatDate(userInfo?.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    최근 로그인{" "}
                    <span className="font-semibold text-slate-900">
                      {formatDateTime(userInfo?.lastSignInAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoRow icon={Mail} label="이메일" value={userInfo?.email} />
                <InfoRow icon={Phone} label="연락처" value={userInfo?.phone || "등록되지 않음"} />
                <InfoRow icon={Activity} label="권한 그룹" value={getRoleDescription(userInfo?.role)} />
                <InfoRow icon={CalendarDays} label="정보 업데이트" value={formatDateTime(userInfo?.updated_at)} />
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#967d5a]">매장 정보</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">연결된 가맹점</h2>
                </div>
              </div>

              {storeInfo ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
                    <Store className="h-5 w-5 text-[#967d5a]" />
                    <div>
                      <p className="text-xs font-medium text-slate-500">매장명</p>
                      <p className="text-base font-semibold text-slate-900">
                        {storeInfo.name || userInfo?.store_name || "지점 정보 없음"}
                      </p>
                      {franchiseInfo?.name && (
                        <p className="mt-1 text-xs text-slate-500">프랜차이즈: {franchiseInfo.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoRow icon={Phone} label="매장 연락처" value={storeInfo.phone || "등록되지 않음"} />
                    <InfoRow icon={UserCircle2} label="담당자" value={storeInfo.manager_name || "미지정"} />
                    <InfoRow icon={MapPin} label="주소" value={storeInfo.address || "등록되지 않음"} />
                    <InfoRow icon={CalendarDays} label="등록일" value={formatDate(storeInfo.created_at)} />
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-slate-500">
                  연결된 매장 정보가 없습니다. 관리자에게 매장 연동을 요청해주세요.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#967d5a]">활동</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">주문 요약</h2>
                </div>
                <span className="text-xs text-slate-400">
                  최근 100건 기준 · 총액 {currencyFormatter.format(orderSummary.totalAmount)}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard title="총 주문" value={`${orderSummary.total}건`} tone="default" />
                <MetricCard title="입금대기" value={`${orderSummary.pending}건`} tone="warning" />
                <MetricCard title="주문확인" value={`${orderSummary.processing}건`} tone="info" />
                <MetricCard title="배송중" value={`${orderSummary.shipped}건`} tone="info" />
                <MetricCard title="배송완료" value={`${orderSummary.delivered}건`} tone="success" />
                <MetricCard title="취소됨" value={`${orderSummary.cancelled}건`} tone="danger" />
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">최근 주문</h2>
                <div className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-slate-600">
                  {latestOrders.length}건
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {latestOrders.length === 0 ? (
                  <p className="rounded-2xl bg-neutral-50 px-4 py-6 text-center text-sm text-slate-400">
                    아직 주문 내역이 없습니다.
                  </p>
                ) : (
                  latestOrders.map((order) => (
                    <article key={order.id} className="rounded-2xl border border-neutral-100 px-4 py-4 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">주문번호</p>
                          <p className="font-semibold text-slate-900">{order.id}</p>
                        </div>
                        <StatusBadge tone={order.statusTone}>{statusDisplay(order.statusCode)}</StatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">주문일 {order.orderedAt}</p>
                      <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-900">
                        <span>{order.items.length}개 품목</span>
                        <span>{currencyFormatter.format(order.totalAmount)}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">지원 안내</h2>
              <p className="text-sm text-slate-500">
                계정 정보 변경이나 매장 연동이 필요하면 본사 담당자에게 문의해주세요.
              </p>
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-neutral-100 px-4 py-3">
                  <p className="text-xs text-slate-400">이메일</p>
                  <p className="font-semibold text-slate-900">franchise@1953.co.kr</p>
                </div>
                <div className="rounded-2xl border border-neutral-100 px-4 py-3">
                  <p className="text-xs text-slate-400">대표번호</p>
                  <p className="font-semibold text-slate-900">02-1234-1953</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
        <Icon className="h-4 w-4 text-[#967d5a]" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value || "정보 없음"}</p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, tone }) {
  const toneClass = {
    default: "text-slate-900",
    warning: "text-amber-700",
    info: "text-blue-700",
    success: "text-emerald-700",
    danger: "text-red-600",
  }[tone];

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className={`mt-2 text-xl font-semibold ${toneClass || "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ tone = "info", children }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-blue-50 text-blue-700",
    danger: "bg-red-50 text-red-700",
    default: "bg-neutral-100 text-slate-600",
  }[tone] || "bg-neutral-100 text-slate-600";

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles}`}>{children}</span>;
}

function formatDate(date) {
  if (!date) return "정보 없음";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "정보 없음";
  }
  return parsed.toLocaleDateString("ko-KR");
}

function formatDateTime(dateTime) {
  if (!dateTime) return "정보 없음";
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) {
    return "정보 없음";
  }
  return parsed.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRoleLabel(role) {
  switch (role) {
    case "OWNER":
      return "가맹점주";
    case "STAFF":
      return "직원";
    case "ADMIN":
      return "관리자";
    default:
      return role || "권한 미지정";
  }
}

function getRoleDescription(role) {
  switch (role) {
    case "OWNER":
      return "가맹점 운영 및 주문 권한";
    case "STAFF":
      return "가맹점 업무 지원 권한";
    case "ADMIN":
      return "본사 관리자 권한";
    default:
      return "권한 정보 없음";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "ACTIVE":
      return "승인 완료";
    case "PENDING":
      return "승인 대기";
    case "REJECTED":
      return "승인 거절";
    default:
      return status || "미확인";
  }
}

function getStatusTone(status) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "REJECTED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-neutral-100 text-slate-600";
  }
}


