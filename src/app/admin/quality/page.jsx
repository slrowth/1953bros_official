"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Calendar,
  Building2,
  Store,
  User,
  Eye,
  Filter,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function QualityPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [records, setRecords] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchChecklists();
    fetchStores();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedDate, selectedStoreId]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      // 날짜가 선택된 경우에만 필터 적용
      if (selectedDate) {
        params.append("date", selectedDate);
      }
      if (selectedStoreId !== "all") {
        params.append("storeId", selectedStoreId);
      }

      const response = await fetch(`/api/quality/records?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "점검 기록을 불러오는데 실패했습니다." }));
        throw new Error(errorData.error || "점검 기록을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error("Fetch records error:", err);
      setError(err.message || "점검 기록을 불러오는 중 오류가 발생했습니다.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklists = async () => {
    try {
      const response = await fetch("/api/quality/checklists");
      const data = await response.json();
      if (response.ok) {
        setChecklists(data.checklists || []);
      }
    } catch (err) {
      console.error("Fetch checklists error:", err);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/stores?isActive=true");
      const data = await response.json();
      if (response.ok) {
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error("Fetch stores error:", err);
    }
  };

  // 달력 생성
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // 이전 달의 마지막 날들
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // 다음 달의 첫 날들 (달력을 채우기 위해)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getDateStatus = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dateRecords = records.filter((record) => record.date === dateStr);
    if (dateRecords.length === 0) return null;

    const allPassed = dateRecords.every((record) => {
      const failedItems = record.items?.filter((item) => item.status === "FAIL").length || 0;
      return failedItems === 0;
    });

    const hasFailed = dateRecords.some((record) => {
      const failedItems = record.items?.filter((item) => item.status === "FAIL").length || 0;
      return failedItems > 0;
    });

    if (hasFailed) return "fail";
    if (allPassed) return "pass";
    return "partial";
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return "-";
    return dateObj.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredRecords = records.filter((record) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        record.checklist?.title?.toLowerCase().includes(query) ||
        record.store?.name?.toLowerCase().includes(query) ||
        record.franchise?.name?.toLowerCase().includes(query) ||
        record.completedBy?.email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusBadge = (record) => {
    const totalItems = record.items?.length || 0;
    const passedItems = record.items?.filter((item) => item.status === "PASS").length || 0;
    const failedItems = record.items?.filter((item) => item.status === "FAIL").length || 0;
    const passRate = totalItems > 0 ? (passedItems / totalItems) * 100 : 0;

    if (failedItems > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
          불합격 ({failedItems}건)
        </span>
      );
    } else if (passRate === 100) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          합격
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
          부분합격 ({passRate.toFixed(0)}%)
        </span>
      );
    }
  };

  const calendarDays = getCalendarDays();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  
  // useMemo로 메모이제이션하여 렌더링 최적화 및 안전성 확보
  const selectedDateSummary = useMemo(() => {
    if (!selectedDate) {
      return {
        hasRecord: false,
        totalRecords: 0,
        totalItems: 0,
        passedItems: 0,
        failedItems: 0,
        passRate: 0,
      };
    }

    const dateRecords = records.filter((record) => record.date === selectedDate);
    if (dateRecords.length === 0) {
      return {
        hasRecord: false,
        totalRecords: 0,
        totalItems: 0,
        passedItems: 0,
        failedItems: 0,
        passRate: 0,
      };
    }

    let totalItems = 0;
    let passedItems = 0;
    let failedItems = 0;

    dateRecords.forEach((record) => {
      const items = record.items || [];
      totalItems += items.length;
      passedItems += items.filter((item) => item.status === "PASS").length;
      failedItems += items.filter((item) => item.status === "FAIL").length;
    });

    const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

    return {
      hasRecord: true,
      totalRecords: dateRecords.length,
      totalItems,
      passedItems,
      failedItems,
      passRate,
    };
  }, [selectedDate, records]);

  const monthlySummary = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const monthlyRecords = records.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= firstDay && recordDate <= lastDay;
    });

    const totalDays = new Set(monthlyRecords.map((r) => r.date)).size;
    let totalItems = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    monthlyRecords.forEach((record) => {
      const items = record.items || [];
      totalItems += items.length;
      totalPassed += items.filter((item) => item.status === "PASS").length;
      totalFailed += items.filter((item) => item.status === "FAIL").length;
    });

    const monthlyPassRate = totalItems > 0 ? Math.round((totalPassed / totalItems) * 100) : 0;

    return {
      totalDays,
      totalRecords: monthlyRecords.length,
      totalItems,
      totalPassed,
      totalFailed,
      passRate: monthlyPassRate,
      lastDay: lastDay,
    };
  }, [currentDate, records]);

  const storeStatistics = useMemo(() => {
    if (selectedStoreId === "all") {
      // 전체 매장 통계
      const storeStats = {};
      records.forEach((record) => {
        const storeId = record.storeId || record.store_id || "no-store";
        const storeName = record.store?.name || record.franchise?.name || "매장 정보 없음";

        if (!storeStats[storeId]) {
          storeStats[storeId] = {
            storeId,
            storeName,
            totalRecords: 0,
            totalItems: 0,
            passedItems: 0,
            failedItems: 0,
          };
        }

        storeStats[storeId].totalRecords += 1;
        const items = record.items || [];
        storeStats[storeId].totalItems += items.length;
        storeStats[storeId].passedItems += items.filter((item) => item.status === "PASS").length;
        storeStats[storeId].failedItems += items.filter((item) => item.status === "FAIL").length;
      });

      return Object.values(storeStats).map((stat) => ({
        ...stat,
        passRate: stat.totalItems > 0 ? Math.round((stat.passedItems / stat.totalItems) * 100) : 0,
      }));
    } else {
      // 선택한 매장 통계
      const storeRecords = records.filter(
        (record) => record.storeId === selectedStoreId || record.store_id === selectedStoreId
      );
      if (storeRecords.length === 0) return [];

      let totalItems = 0;
      let passedItems = 0;
      let failedItems = 0;

      storeRecords.forEach((record) => {
        const items = record.items || [];
        totalItems += items.length;
        passedItems += items.filter((item) => item.status === "PASS").length;
        failedItems += items.filter((item) => item.status === "FAIL").length;
      });

      const selectedStore = stores.find((s) => s.id === selectedStoreId);
      return [
        {
          storeId: selectedStoreId,
          storeName: selectedStore?.name || "매장 정보 없음",
          totalRecords: storeRecords.length,
          totalItems,
          passedItems,
          failedItems,
          passRate: totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0,
        },
      ];
    }
  }, [selectedStoreId, records, stores]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">점검 기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">품질점검 기록</h1>
            <p className="mt-1 text-sm text-slate-500">
              매장별 위생 및 서비스 품질점검 기록을 조회하고 관리하세요
            </p>
          </div>
          <Link
            href="/admin/quality/checklists/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#967d5a]/90"
          >
            <ClipboardCheck className="h-4 w-4" />
            체크리스트 등록
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 달력 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => navigateMonth(-1)}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-neutral-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-slate-900">
                {currentDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-neutral-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-semibold text-slate-500"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((dayObj, index) => {
                const dateStr = dayObj.date.toISOString().split("T")[0];
                const isSelected = dateStr === selectedDate;
                const status = getDateStatus(dayObj.date);
                const isToday = dateStr === new Date().toISOString().split("T")[0];

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative p-2 text-sm transition ${
                      !dayObj.isCurrentMonth
                        ? "text-slate-300"
                        : isSelected
                        ? "bg-[#967d5a] text-white font-semibold rounded-lg"
                        : "text-slate-700 hover:bg-neutral-100 rounded-lg"
                    } ${isToday && !isSelected ? "ring-2 ring-[#967d5a] rounded-lg" : ""}`}
                  >
                    {dayObj.date.getDate()}
                    {status && (
                      <span
                        className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                          status === "pass"
                            ? "bg-green-500"
                            : status === "fail"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 매장 선택 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">매장 선택</h3>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            >
              <option value="all">전체 매장</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.franchise?.name || ""} - {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* 선택한 날짜별 점검현황 요약 */}
          {selectedDate && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {selectedDate ? formatDate(selectedDate) : "날짜 선택"} 점검현황
              </h3>
              {selectedDateSummary.hasRecord ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-600">점검 기록 수</div>
                      <div className="mt-1 text-2xl font-bold text-purple-700">
                        {selectedDateSummary.totalRecords}건
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="text-sm text-green-600">합격</div>
                    <div className="mt-1 text-2xl font-semibold text-green-700">
                      {selectedDateSummary.passedItems}
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4">
                    <div className="text-sm text-red-600">불합격</div>
                    <div className="mt-1 text-2xl font-semibold text-red-700">
                      {selectedDateSummary.failedItems}
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-600">합격률</div>
                    <div className="text-2xl font-semibold text-blue-700">
                      {selectedDateSummary.passRate}%
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${selectedDateSummary.passRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <div className="text-sm text-slate-500">해당 날짜에 점검 기록이 없습니다.</div>
              </div>
            )}
            </div>
          )}

          {/* 월별 점검현황 요약 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {currentDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })} 점검현황
            </h3>
            {monthlySummary.totalDays > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-600">점검 진행 일수</div>
                      <div className="mt-1 text-3xl font-bold text-purple-700">
                        {monthlySummary.totalDays}일
                      </div>
                      <div className="mt-1 text-xs text-purple-500">
                        이번 달 총 {monthlySummary.lastDay?.getDate() || 0}일 중 {monthlySummary.totalDays}일 점검 완료 (
                        {monthlySummary.lastDay?.getDate()
                          ? Math.round((monthlySummary.totalDays / monthlySummary.lastDay.getDate()) * 100)
                          : 0}%)
                      </div>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                      <Calendar className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-purple-200">
                    <div
                      className="h-full bg-purple-600 transition-all"
                      style={{
                        width: `${
                          monthlySummary.lastDay?.getDate()
                            ? Math.round((monthlySummary.totalDays / monthlySummary.lastDay.getDate()) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-slate-600">전체 기록</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-700">
                      {monthlySummary.totalRecords}건
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-slate-600">전체 항목</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-700">
                      {monthlySummary.totalItems}개
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="text-sm text-green-600">합격 항목</div>
                    <div className="mt-1 text-2xl font-semibold text-green-700">
                      {monthlySummary.totalPassed}개
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4">
                    <div className="text-sm text-red-600">불합격 항목</div>
                    <div className="mt-1 text-2xl font-semibold text-red-700">
                      {monthlySummary.totalFailed}개
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-600">월간 합격률</div>
                    <div className="text-2xl font-semibold text-blue-700">
                      {monthlySummary.passRate}%
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${monthlySummary.passRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <div className="text-sm text-slate-500">이번 달 점검 기록이 없습니다.</div>
              </div>
            )}
          </div>
        </div>

        {/* 점검 기록 목록 및 매장별 통계 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 검색 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="검색 (체크리스트, 매장, 점검자)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
              />
            </div>
          </div>

          {/* 매장별 통계 */}
          {storeStatistics.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {selectedStoreId === "all" ? "매장별 통계" : "매장 통계"}
              </h3>
              <div className="space-y-3">
                {storeStatistics.map((stat) => (
                  <div
                    key={stat.storeId}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-semibold text-slate-900">{stat.storeName}</div>
                      <div className="text-sm text-slate-500">{stat.totalRecords}건</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-green-50 p-3">
                        <div className="text-xs text-green-600">합격</div>
                        <div className="mt-1 text-lg font-semibold text-green-700">
                          {stat.passedItems}개
                        </div>
                      </div>
                      <div className="rounded-lg bg-red-50 p-3">
                        <div className="text-xs text-red-600">불합격</div>
                        <div className="mt-1 text-lg font-semibold text-red-700">
                          {stat.failedItems}개
                        </div>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="text-xs text-blue-600">합격률</div>
                        <div className="mt-1 text-lg font-semibold text-blue-700">
                          {stat.passRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {/* 점검 기록 목록 */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      점검일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      체크리스트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      매장
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      점검자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      결과
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                      통과율
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-700">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                        점검 기록이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const totalItems = record.items?.length || 0;
                      const passedItems = record.items?.filter((item) => item.status === "PASS").length || 0;
                      const passRate = totalItems > 0 ? (passedItems / totalItems) * 100 : 0;

                      return (
                        <tr key={record.id} className="hover:bg-neutral-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            <div>
                              <div className="font-medium">{record.checklist?.title || "-"}</div>
                              <div className="text-xs text-slate-500">v{record.checklistVersion}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            <div>
                              <div className="font-medium">
                                {record.store?.name || record.franchise?.name || "-"}
                              </div>
                              {record.store && (
                                <div className="text-xs text-slate-500">{record.franchise?.name}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {record.completedBy?.email || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm">{getStatusBadge(record)}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 rounded-full bg-neutral-200">
                                <div
                                  className="h-2 rounded-full bg-green-500"
                                  style={{ width: `${passRate}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-600">
                                {passRate.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <Link
                              href={`/admin/quality/records/${record.id}`}
                              className="inline-flex items-center gap-1 text-[#967d5a] transition hover:text-[#967d5a]/80"
                            >
                              <Eye className="h-4 w-4" />
                              상세보기
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
