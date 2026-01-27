/**
 * 모바일 품질점검 현황 페이지
 * 캘린더 기반 품질점검 현황 조회
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import MobileLayout from "@/components/mobile/MobileLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { formatDate, formatDateKorean } from "@/utils/formatDate";

export default function MobileQualityCheckPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDateRecord, setSelectedDateRecord] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // 오늘 날짜
  const today = formatDate(new Date());

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/quality/records/my");
      const data = await response.json();

      if (response.ok) {
        const recordsMap = {};
        (data.records || []).forEach((record) => {
          recordsMap[record.date] = record;
        });
        setRecords(recordsMap);
      } else {
        throw new Error(data.error || "점검 기록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("Fetch records error:", err);
      setError(err.message || "점검 기록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
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
    const dateStr = formatDate(date);
    const record = records[dateStr];
    if (!record) return null;

    const totalItems = record.items?.length || 0;
    const failedItems = record.items?.filter((item) => item.status === "FAIL").length || 0;
    const passedItems = record.items?.filter((item) => item.status === "PASS").length || 0;

    if (failedItems > 0) return "fail";
    if (passedItems === totalItems && totalItems > 0) return "pass";
    return "partial";
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = async (date) => {
    const dateStr = formatDate(date);
    const record = records[dateStr];
    
    if (record) {
      // 상세 기록 로드
      try {
        const response = await fetch(`/api/quality/records/${record.id}`);
        const data = await response.json();
        if (response.ok && data.record) {
          setSelectedDateRecord(data.record);
          setSelectedDate(dateStr);
        } else {
          setSelectedDateRecord(record);
          setSelectedDate(dateStr);
        }
      } catch (err) {
        console.error("Load record detail error:", err);
        setSelectedDateRecord(record);
        setSelectedDate(dateStr);
      }
    } else {
      // 기록이 없으면 점검 작성 페이지로 이동
      router.push(`/m/quality-check/new?date=${dateStr}`);
    }
  };

  const handleTodayCheck = () => {
    router.push(`/m/quality-check/new?date=${today}`);
  };

  const calendarDays = getCalendarDays();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const monthYear = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;

  return (
    <MobileLayout
      title="품질점검"
      headerRightAction={
        <button
          onClick={handleTodayCheck}
          className="rounded-lg bg-[#967d5a] px-3 py-1.5 text-xs font-semibold text-white transition active:bg-[#7a6548]"
        >
          오늘 점검하기
        </button>
      }
      headerBottomContent={
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition active:bg-neutral-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-900">{monthYear}</span>
            </div>
            <button
              onClick={() => navigateMonth(1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition active:bg-neutral-100"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col">
        {loading ? (
          <LoadingSpinner message="점검 기록을 불러오는 중..." />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={fetchRecords} />
          </div>
        ) : (
          <>
            {/* 캘린더 */}
            <div className="px-4 pt-4 pb-4">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-slate-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dateStr = formatDate(day.date);
                  const isToday = dateStr === today;
                  const status = getDateStatus(day.date);
                  const hasRecord = !!records[dateStr];

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(day.date)}
                      className={`relative flex flex-col items-center justify-center aspect-square rounded-lg text-sm transition active:bg-neutral-100 ${
                        !day.isCurrentMonth
                          ? "text-slate-300"
                          : isToday
                          ? "bg-[#967d5a]/10 text-[#967d5a] font-semibold"
                          : "text-slate-900"
                      }`}
                    >
                      <span>{day.date.getDate()}</span>
                      {hasRecord && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                          {status === "pass" ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          ) : status === "fail" ? (
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 범례 */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>합격</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span>부분합격</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span>불합격</span>
                </div>
              </div>
            </div>

            {/* 선택한 날짜의 점검 기록 상세 모달 */}
            {selectedDateRecord && selectedDate && (
              <div
                className="fixed inset-0 z-[60] bg-black/50"
                onClick={() => {
                  setSelectedDateRecord(null);
                  setSelectedDate(null);
                }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white"
                  onClick={(e) => e.stopPropagation()}
                  style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0))' }}
                >
                  {/* 헤더 */}
                  <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white p-4 z-10">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {formatDateKorean(new Date(selectedDate))} 점검내역
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedDateRecord(null);
                        setSelectedDate(null);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg transition active:bg-neutral-100"
                    >
                      <X className="h-5 w-5 text-slate-600" />
                    </button>
                  </div>

                  {/* 점검 기록 상세 */}
                  <div className="p-4 space-y-4">
                    {/* 체크리스트 정보 */}
                    {selectedDateRecord.checklist && (
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedDateRecord.checklist.title}
                        </p>
                        {selectedDateRecord.checklist.version && (
                          <p className="mt-1 text-xs text-slate-500">
                            버전: {selectedDateRecord.checklist.version}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 점검 항목 */}
                    {selectedDateRecord.items && selectedDateRecord.items.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-900">점검 항목</h4>
                        {selectedDateRecord.items.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                          >
                            <div className="mt-0.5 shrink-0">
                              {item.status === "PASS" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-400">
                                  {index + 1}
                                </span>
                                <p className="text-sm font-medium text-slate-900">
                                  {item.item?.label || "항목"}
                                </p>
                              </div>
                              {item.comment && (
                                <p className="mt-1 text-xs text-slate-600">{item.comment}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">점검 항목이 없습니다.</p>
                    )}

                    {/* 메모 */}
                    {selectedDateRecord.notes && (
                      <div className="border-t border-neutral-200 pt-4">
                        <h4 className="mb-2 text-sm font-semibold text-slate-900">메모</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {selectedDateRecord.notes}
                        </p>
                      </div>
                    )}

                    {/* 수정 버튼 */}
                    <div className="border-t border-neutral-200 pt-4">
                      <button
                        onClick={() => {
                          router.push(`/m/quality-check/new?date=${selectedDate}`);
                        }}
                        className="w-full rounded-xl bg-[#967d5a] py-3 text-sm font-semibold text-white transition active:bg-[#7a6548]"
                      >
                        수정하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
