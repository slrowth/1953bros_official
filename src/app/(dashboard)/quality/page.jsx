"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Minus,
  Save,
  FileText,
} from "lucide-react";

export default function QualityPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [checklists, setChecklists] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [checklistItems, setChecklistItems] = useState({});
  const [itemChecked, setItemChecked] = useState({});
  const [itemComments, setItemComments] = useState({});
  const [openCommentModal, setOpenCommentModal] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [notes, setNotes] = useState("");
  const [existingRecord, setExistingRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDateRecord, setSelectedDateRecord] = useState(null);

  useEffect(() => {
    fetchUserInfo();
    fetchChecklists();
    fetchRecords();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadRecordForDate(selectedDate);
      loadSelectedDateRecord(selectedDate);
    }
  }, [selectedDate, records]);

  const fetchUserInfo = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return;

      const { data: userData } = await supabase
        .from("users")
        .select("id, store_id, franchise_id")
        .eq("id", authUser.id)
        .single();

      if (userData) {
        setUserInfo(userData);
      }
    } catch (error) {
      console.error("Fetch user info error:", error);
    }
  };

  const fetchChecklists = async () => {
    try {
      const response = await fetch("/api/quality/checklists");
      const data = await response.json();
      if (response.ok) {
        const activeChecklists = (data.checklists || []).filter((c) => c.isActive);
        setChecklists(activeChecklists);
        
        // 모든 체크리스트의 항목을 미리 로드
        const itemsMap = {};
        for (const checklist of activeChecklists) {
          try {
            const itemResponse = await fetch(`/api/quality/checklists/${checklist.id}`);
            const itemData = await itemResponse.json();
            if (itemResponse.ok && itemData.checklist) {
              itemsMap[checklist.id] = itemData.checklist.items || [];
            }
          } catch (err) {
            console.error(`Load checklist items error for ${checklist.id}:`, err);
          }
        }
        setChecklistItems(itemsMap);
        
        // 첫 번째 체크리스트를 기본 선택
        if (activeChecklists.length > 0 && !selectedChecklistId) {
          setSelectedChecklistId(activeChecklists[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch checklists error:", err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/quality/records/my");
      const data = await response.json();
      if (response.ok) {
        const recordsMap = {};
        (data.records || []).forEach((record) => {
          recordsMap[record.date] = record;
        });
        setRecords(recordsMap);
      }
    } catch (err) {
      console.error("Fetch records error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecordForDate = (date) => {
    const record = records[date];
    if (record) {
      setExistingRecord(record);
      setIsEditing(true);
      setSelectedChecklistId(record.checklistId);
      
      // 기존 기록 데이터 로드
      const checked = {};
      const comments = {};
      (record.items || []).forEach((recordItem) => {
        checked[recordItem.itemId] = recordItem.status === "PASS";
        comments[recordItem.itemId] = recordItem.comment || "";
      });
      setItemChecked(checked);
      setItemComments(comments);
      setNotes(record.notes || "");
    } else {
      setExistingRecord(null);
      setIsEditing(false);
      setNotes("");
      setItemChecked({});
      setItemComments({});
    }
  };

  const loadSelectedDateRecord = async (date) => {
    const record = records[date];
    if (record) {
      // 상세 기록 로드
      try {
        const response = await fetch(`/api/quality/records/${record.id}`);
        const data = await response.json();
        if (response.ok && data.record) {
          setSelectedDateRecord(data.record);
        }
      } catch (err) {
        console.error("Load record detail error:", err);
        setSelectedDateRecord(record);
      }
    } else {
      setSelectedDateRecord(null);
    }
  };

  const handleChecklistSelect = (checklistId) => {
    setSelectedChecklistId(checklistId);
    setIsEditing(false);
    setExistingRecord(null);
    setNotes("");
    setItemChecked({});
    setItemComments({});
  };

  const handleCheckboxChange = (itemId) => {
    setItemChecked((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleOpenComment = (itemId) => {
    setOpenCommentModal(itemId);
    setCommentText(itemComments[itemId] || "");
  };

  const handleSaveComment = () => {
    if (openCommentModal) {
      setItemComments((prev) => ({
        ...prev,
        [openCommentModal]: commentText,
      }));
      setOpenCommentModal(null);
      setCommentText("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedChecklistId || !userInfo) {
      alert("체크리스트를 선택해주세요.");
      return;
    }

    const selectedChecklist = checklists.find((c) => c.id === selectedChecklistId);
    if (!selectedChecklist) {
      alert("체크리스트를 찾을 수 없습니다.");
      return;
    }

    const items = checklistItems[selectedChecklistId] || [];
    
    try {
      setSubmitting(true);

      const recordItems = items.map((item) => ({
        itemId: item.id,
        status: itemChecked[item.id] ? "PASS" : "FAIL",
        comment: itemComments[item.id] || null,
      }));

      const url = isEditing && existingRecord
        ? `/api/quality/records/${existingRecord.id}`
        : "/api/quality/records";
      const method = isEditing && existingRecord ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checklistId: selectedChecklistId,
          checklistVersion: selectedChecklist.version,
          date: selectedDate,
          items: recordItems,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "점검 기록 저장에 실패했습니다.");
      }

      alert(isEditing ? "점검 기록이 수정되었습니다." : "점검 기록이 저장되었습니다.");
      await fetchRecords();
      loadRecordForDate(selectedDate);
      loadSelectedDateRecord(selectedDate);
    } catch (error) {
      console.error("Submit error:", error);
      alert(error.message || "점검 기록 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
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

  const formatDate = (date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PASS":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "FAIL":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "N/A":
        return <Minus className="h-4 w-4 text-slate-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PASS":
        return "합격";
      case "FAIL":
        return "불합격";
      case "N/A":
        return "해당없음";
      default:
        return "-";
    }
  };

  const calendarDays = getCalendarDays();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const currentItems = checklistItems[selectedChecklistId] || [];

  // 선택한 날짜의 점검현황 요약
  const getSelectedDateSummary = () => {
    const record = records[selectedDate];
    if (!record) {
      return {
        hasRecord: false,
        totalItems: 0,
        passedItems: 0,
        failedItems: 0,
        passRate: 0,
      };
    }

    const totalItems = record.items?.length || 0;
    const passedItems = record.items?.filter((item) => item.status === "PASS").length || 0;
    const failedItems = record.items?.filter((item) => item.status === "FAIL").length || 0;
    const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

    return {
      hasRecord: true,
      totalItems,
      passedItems,
      failedItems,
      passRate,
    };
  };

  // 현재 월의 점검현황 요약
  const getMonthlySummary = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const monthlyRecords = Object.values(records).filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= firstDay && recordDate <= lastDay;
    });

    const totalDays = monthlyRecords.length;
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
      totalItems,
      totalPassed,
      totalFailed,
      passRate: monthlyPassRate,
      lastDay: lastDay,
    };
  };

  const selectedDateSummary = getSelectedDateSummary();
  const monthlySummary = getMonthlySummary();

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">품질 점검</h1>
          <p className="mt-1 text-sm text-slate-500">
            매장 내 위생 및 서비스 품질점검을 진행하세요
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 달력 */}
          <div className="lg:col-span-1">
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
                  const isToday =
                    dateStr === new Date().toISOString().split("T")[0];

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

            {/* 선택한 날짜별 점검현황 요약 */}
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {formatDate(new Date(selectedDate))} 점검현황
              </h3>
              {selectedDateSummary.hasRecord ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-purple-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-purple-600">점검 상태</div>
                        <div className="mt-1 text-lg font-semibold text-purple-700">점검 완료</div>
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
                  <div className="mt-2 text-xs text-slate-400">점검을 진행해주세요.</div>
                </div>
              )}
            </div>

            {/* 월별 점검현황 요약 */}
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {currentDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })} 점검현황
              </h3>
              {monthlySummary.lastDay ? (
                <div className="space-y-4">
                  {/* 점검 일수 통계 - 강조 */}
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
                        style={{ width: `${monthlySummary.lastDay?.getDate() ? Math.round((monthlySummary.totalDays / monthlySummary.lastDay.getDate()) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <div className="text-sm text-slate-600">전체 항목</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-700">
                        {monthlySummary.totalItems}개
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4">
                      <div className="text-sm text-slate-600">평균 일일 항목</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-700">
                        {monthlySummary.totalDays > 0 
                          ? Math.round(monthlySummary.totalItems / monthlySummary.totalDays)
                          : 0}개
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
                  <div className="mt-2 text-xs text-slate-400">점검을 시작해주세요.</div>
                </div>
              )}
            </div>
          </div>

          {/* 체크리스트 목록 및 점검 폼 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 체크리스트 선택 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">체크리스트 선택</h2>
              <div className="flex flex-wrap gap-3">
                {checklists.map((checklist) => {
                  const isSelected = selectedChecklistId === checklist.id;
                  return (
                    <button
                      key={checklist.id}
                      onClick={() => handleChecklistSelect(checklist.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "bg-[#967d5a] text-white"
                          : "bg-neutral-100 text-slate-700 hover:bg-neutral-200"
                      }`}
                    >
                      {checklist.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 체크리스트 항목 */}
            {selectedChecklistId && currentItems.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedDate ? formatDate(new Date(selectedDate)) : "날짜 선택"}
                  </h2>
                  {existingRecord && (
                    <p className="mt-1 text-sm text-slate-500">
                      기존 점검 기록이 있습니다. 수정하거나 새로 작성할 수 있습니다.
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 점검 항목 */}
                  <div>
                    <label className="mb-4 block text-sm font-medium text-slate-700">
                      점검 항목
                    </label>
                    <div className="space-y-3">
                      {currentItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                        >
                          <input
                            type="checkbox"
                            checked={itemChecked[item.id] || false}
                            onChange={() => handleCheckboxChange(item.id)}
                            className="h-5 w-5 rounded border-neutral-300 text-[#967d5a] focus:ring-[#967d5a]"
                          />
                          <span className="flex-1 text-slate-900">
                            {index + 1}. {item.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenComment(item.id)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                              itemComments[item.id]
                                ? "bg-blue-100 text-blue-700"
                                : "bg-neutral-100 text-slate-600 hover:bg-neutral-200"
                            }`}
                          >
                            <FileText className="h-4 w-4" />
                            메모
                            {itemComments[item.id] && (
                              <span className="ml-1 h-2 w-2 rounded-full bg-blue-500"></span>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 비고 */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      비고
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                      placeholder="추가 비고사항을 입력하세요"
                    />
                  </div>

                  {/* 저장 버튼 */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting || !selectedChecklistId}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#967d5a]/90 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {submitting
                        ? "저장 중..."
                        : isEditing
                        ? "수정"
                        : "저장"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 선택한 날짜의 점검현황 */}
            {selectedDateRecord && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">
                  {formatDate(new Date(selectedDate))} 점검현황
                </h2>
                
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="text-sm text-green-600">합격</div>
                    <div className="mt-1 text-2xl font-semibold text-green-700">
                      {selectedDateRecord.items?.filter((item) => item.status === "PASS").length || 0}
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4">
                    <div className="text-sm text-red-600">불합격</div>
                    <div className="mt-1 text-2xl font-semibold text-red-700">
                      {selectedDateRecord.items?.filter((item) => item.status === "FAIL").length || 0}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm text-slate-600">전체</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-700">
                      {selectedDateRecord.items?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">점검 항목 상세</h3>
                  {selectedDateRecord.items?.map((recordItem, index) => {
                    const item = recordItem.item;
                    return (
                      <div
                        key={recordItem.id}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#967d5a] text-xs font-semibold text-white">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              {getStatusIcon(recordItem.status)}
                              <span className="font-medium text-slate-900">
                                {item?.label || "항목 정보 없음"}
                              </span>
                              <span className="ml-auto text-sm text-slate-500">
                                {getStatusText(recordItem.status)}
                              </span>
                            </div>
                            {recordItem.comment && (
                              <p className="text-sm text-slate-600">{recordItem.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedDateRecord.notes && (
                  <div className="mt-4 rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-blue-900">비고</h4>
                    <p className="text-sm text-blue-700">{selectedDateRecord.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메모 모달 */}
      {openCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">메모 작성</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
              placeholder="메모를 입력하세요"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpenCommentModal(null);
                  setCommentText("");
                }}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveComment}
                className="rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#967d5a]/90"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
