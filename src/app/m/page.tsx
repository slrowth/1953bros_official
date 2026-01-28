/**
 * 모바일 메인 페이지
 * 대시보드 및 빠른 액션
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, ClipboardList, CheckSquare, Package, ArrowRight, Bell } from "lucide-react";
import MobileLayout from "@/components/mobile/MobileLayout";
import { useOrders } from "@/hooks/useOrders";
import { useQualityRecords } from "@/hooks/useQualityRecords";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import OrderStatusBadge from "@/components/common/OrderStatusBadge";
import { createClient } from "@/lib/supabase/client";

export default function MobileHomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [today] = useState(() => formatDate(new Date()));
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 오늘 주문 조회 (인증 체크 완료 후에만 실행)
  const { orders: todayOrders, loading: ordersLoading, error: ordersError } = useOrders({
    limit: 10,
    enabled: !checkingAuth,
  });

  // 오늘 품질점검 기록 조회 (인증 체크 완료 후에만 실행)
  const { records: todayRecords, loading: recordsLoading, error: recordsError } = useQualityRecords({
    date: today,
    enabled: !checkingAuth,
  });

  // 인증 체크 (클라이언트 사이드) - 즉시 실행
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          // 인증되지 않은 경우 로그인 페이지로 리다이렉트
          const currentPath = window.location.pathname;
          const redirectPath = currentPath !== "/m" ? currentPath : "";
          router.replace(`/m/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`);
          return;
        }

        // 사용자 정보 확인
        const { data: userData } = await supabase
          .from("users")
          .select("role, status")
          .eq("id", authUser.id)
          .single();

        if (!userData || (userData.role !== "OWNER" && userData.role !== "STAFF")) {
          // 권한이 없는 경우 로그인 페이지로
          router.replace("/m/login?error=unauthorized");
          return;
        }

        if (userData.status !== "APPROVED") {
          // 승인되지 않은 경우
          router.replace("/m/login?error=pending");
          return;
        }

        // 인증 성공
        setCheckingAuth(false);
      } catch (error) {
        console.error("Auth check error:", error);
        // 에러 발생 시에도 로그인 페이지로
        router.replace("/m/login");
      }
    };

    // 즉시 실행
    checkAuth();
  }, [router]);

  // 공지사항 조회
  useEffect(() => {
    if (checkingAuth) return; // 인증 체크 완료 후에만 실행

    const fetchNotices = async () => {
      try {
        setNoticesLoading(true);
        const response = await fetch("/api/notices");
        const data = await response.json();

        if (response.ok) {
          setNotices(data.notices || []);
        }
      } catch (err) {
        console.error("Notices fetch error:", err);
      } finally {
        setNoticesLoading(false);
      }
    };

    fetchNotices();
  }, [checkingAuth]);

  // 오늘 주문 통계
  const todayStats = useMemo(() => {
    const total = todayOrders.length;
    const totalAmount = todayOrders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0);
    }, 0);
    const pendingCount = todayOrders.filter((o) => o.statusCode === "NEW" || o.statusCode === "PROCESSING").length;

    return {
      total,
      totalAmount,
      pendingCount,
    };
  }, [todayOrders]);

  // 오늘 품질점검 통계
  const qualityStats = useMemo(() => {
    const total = todayRecords.length;
    const pendingCount = todayRecords.filter((r) => !r.completedById).length;

    return {
      total,
      pendingCount,
    };
  }, [todayRecords]);

  // 읽지 않은 공지사항 개수
  const unreadNoticesCount = useMemo(() => {
    return notices.filter((notice) => !notice.isRead).length;
  }, [notices]);

  const isLoading = ordersLoading || recordsLoading || checkingAuth;

  // 인증 체크 중이면 로딩 표시
  if (checkingAuth) {
    return (
      <MobileLayout title="홈" showBackButton={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner message="로딩 중..." size={8} fullHeight={false} />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="홈" showBackButton={false}>
      <div className="p-4 space-y-4">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Package className="h-4 w-4" />
              오늘 주문
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{todayStats.total}건</p>
            <p className="mt-1 text-xs text-slate-500">
              {formatCurrency(todayStats.totalAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckSquare className="h-4 w-4" />
              오늘 점검
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{qualityStats.total}건</p>
            <p className="mt-1 text-xs text-slate-500">
              {qualityStats.pendingCount > 0 ? `${qualityStats.pendingCount}건 대기` : "완료"}
            </p>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-slate-700">빠른 액션</h2>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/m/order")}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition active:bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#967d5a]/10 p-2">
                  <ShoppingCart className="h-5 w-5 text-[#967d5a]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">주문하기</p>
                  <p className="text-xs text-slate-500">상품을 선택하여 주문하세요</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/m/order/status")}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition active:bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">주문현황</p>
                  <p className="text-xs text-slate-500">
                    {todayStats.pendingCount > 0
                      ? `${todayStats.pendingCount}건 처리 대기`
                      : "주문 내역 확인"}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/m/quality-check")}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition active:bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-2">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">품질점검</p>
                  <p className="text-xs text-slate-500">
                    {qualityStats.pendingCount > 0
                      ? `${qualityStats.pendingCount}건 대기`
                      : "점검 기록 작성"}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </button>

            <button
              onClick={() => router.push("/m/notices")}
              className="relative flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition active:bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">공지사항</p>
                  <p className="text-xs text-slate-500">
                    {unreadNoticesCount > 0
                      ? `읽지 않은 공지 ${unreadNoticesCount}개`
                      : "공지사항 확인"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadNoticesCount > 0 && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
                    {unreadNoticesCount > 9 ? "9+" : unreadNoticesCount}
                  </div>
                )}
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        {/* 최근 주문 */}
        <div className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-slate-700">최근 주문</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner message="로딩 중..." size={8} fullHeight={false} />
            </div>
          ) : ordersError ? (
            <ErrorMessage message={ordersError} />
          ) : todayOrders.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">오늘 주문 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayOrders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  onClick={() => router.push(`/m/order/status?orderId=${order.id}`)}
                  className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition active:bg-neutral-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {order.orderCode || order.id}
                        </p>
                        <OrderStatusBadge status={order.statusCode} size="small" />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.orderedAt} · {order.items?.length || 0}개 품목
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
