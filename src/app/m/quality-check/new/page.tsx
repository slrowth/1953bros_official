/**
 * 모바일 품질점검 작성 페이지
 * 체크리스트 기반 품질점검 기록 작성
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, XCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import MobileLayout from "@/components/mobile/MobileLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useQualityRecords } from "@/hooks/useQualityRecords";
import { formatDate } from "@/utils/formatDate";

export default function MobileQualityCheckNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  
  const [selectedDate, setSelectedDate] = useState(() => dateParam || formatDate(new Date()));
  const [checklists, setChecklists] = useState([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [checklistItems, setChecklistItems] = useState([]);
  const [itemChecked, setItemChecked] = useState({});
  const [itemComments, setItemComments] = useState({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [existingRecord, setExistingRecord] = useState(null);

  // 선택한 날짜의 점검 기록 조회
  const { records, loading: recordsLoading, refetch: refetchRecords } = useQualityRecords({
    date: selectedDate,
  });

  useEffect(() => {
    fetchUserInfo();
    fetchChecklists();
  }, []);

  useEffect(() => {
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [dateParam]);

  useEffect(() => {
    if (selectedDate && records.length > 0) {
      const record = records[0];
      setExistingRecord(record);
      // 기존 기록이 있으면 체크 상태 복원
      const checked = {};
      const comments = {};
      record.items?.forEach((item) => {
        checked[item.itemId] = item.status === "PASS";
        if (item.comment) {
          comments[item.itemId] = item.comment;
        }
      });
      setItemChecked(checked);
      setItemComments(comments);
      setNotes(record.notes || "");
    } else {
      setExistingRecord(null);
      setItemChecked({});
      setItemComments({});
      setNotes("");
    }
  }, [selectedDate, records]);

  useEffect(() => {
    if (selectedChecklistId) {
      loadChecklistItems(selectedChecklistId);
    }
  }, [selectedChecklistId]);

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
      setLoading(true);
      const response = await fetch("/api/quality/checklists");
      const data = await response.json();

      if (response.ok) {
        const activeChecklists = (data.checklists || []).filter((c) => c.isActive);
        setChecklists(activeChecklists);

        if (activeChecklists.length > 0 && !selectedChecklistId) {
          setSelectedChecklistId(activeChecklists[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch checklists error:", err);
      setError("체크리스트를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadChecklistItems = async (checklistId) => {
    try {
      const response = await fetch(`/api/quality/checklists/${checklistId}`);
      const data = await response.json();

      if (response.ok && data.checklist) {
        setChecklistItems(data.checklist.items || []);
      }
    } catch (err) {
      console.error("Load checklist items error:", err);
    }
  };

  const handleItemToggle = (itemId) => {
    setItemChecked((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleCommentChange = (itemId, comment) => {
    setItemComments((prev) => ({
      ...prev,
      [itemId]: comment,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedChecklistId || !userInfo) {
      alert("체크리스트를 선택해주세요.");
      return;
    }

    const selectedChecklist = checklists.find((c) => c.id === selectedChecklistId);
    if (!selectedChecklist) {
      alert("체크리스트를 찾을 수 없습니다.");
      return;
    }

    if (checklistItems.length === 0) {
      alert("체크리스트 항목이 없습니다.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const recordItems = checklistItems.map((item) => ({
        itemId: item.id,
        status: itemChecked[item.id] ? "PASS" : "FAIL",
        comment: itemComments[item.id] || null,
      }));

      const url = existingRecord
        ? `/api/quality/records/${existingRecord.id}`
        : "/api/quality/records";
      const method = existingRecord ? "PUT" : "POST";

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

      alert(existingRecord ? "점검 기록이 수정되었습니다." : "점검 기록이 저장되었습니다.");
      router.push("/m/quality-check");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "점검 기록 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(formatDate(newDate));
  };

  const hasChanges = Object.keys(itemChecked).length > 0 || Object.keys(itemComments).length > 0 || notes.trim().length > 0;

  return (
    <MobileLayout 
      title="품질점검 작성"
      headerBottomContent={
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition active:bg-neutral-100"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
              />
            </div>
            <button
              onClick={() => navigateDate(1)}
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
          <LoadingSpinner message="체크리스트를 불러오는 중..." />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={fetchChecklists} />
          </div>
        ) : (
          <>
            {/* 체크리스트 선택 */}
            {checklists.length > 1 && (
              <div className="border-b border-neutral-200 bg-white p-4">
                <select
                  value={selectedChecklistId}
                  onChange={(e) => setSelectedChecklistId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                >
                  {checklists.map((checklist) => (
                    <option key={checklist.id} value={checklist.id}>
                      {checklist.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 체크리스트 항목 */}
            {checklistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <p className="text-sm text-slate-500">체크리스트 항목이 없습니다.</p>
              </div>
            ) : (
              <div className="px-4 pt-4 pb-4 space-y-3">
                {checklistItems.map((item, index) => {
                  const isChecked = itemChecked[item.id] || false;
                  const comment = itemComments[item.id] || "";

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleItemToggle(item.id)}
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                            isChecked
                              ? "border-green-500 bg-green-50"
                              : "border-neutral-300 bg-white"
                          }`}
                        >
                          {isChecked ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-neutral-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">
                              {index + 1}
                            </span>
                            <h3 className="font-semibold text-slate-900">{item.label}</h3>
                          </div>
                          <textarea
                            placeholder="비고 (선택사항)"
                            value={comment}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#967d5a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 메모 */}
            <div className="border-t border-neutral-200 bg-white p-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">메모</label>
              <textarea
                placeholder="추가 메모를 입력하세요 (선택사항)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#967d5a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                rows={3}
              />
            </div>

            {/* 저장 버튼 */}
            <div className="border-t border-neutral-200 bg-white p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0))' }}>
              <button
                onClick={handleSubmit}
                disabled={submitting || !hasChanges || checklistItems.length === 0}
                className="w-full rounded-xl bg-[#967d5a] py-4 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed active:bg-[#7a6548]"
              >
                {submitting
                  ? "저장 중..."
                  : existingRecord
                  ? "수정하기"
                  : "저장하기"}
              </button>
              {existingRecord && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  {formatDate(new Date(existingRecord.createdAt))}에 작성된 기록입니다
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
