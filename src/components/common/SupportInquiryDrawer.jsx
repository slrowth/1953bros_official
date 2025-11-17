"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, MessageSquare, X } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "ORDER", label: "주문 관리" },
  { value: "NOTICE", label: "공지사항" },
  { value: "QUALITY", label: "품질 점검" },
  { value: "TRAINING", label: "교육 자료" },
  { value: "ACCOUNT", label: "계정/권한" },
  { value: "OTHER", label: "기타" },
];

export default function SupportInquiryDrawer({ isOpen, onClose, defaultPagePath }) {
  const [category, setCategory] = useState("ORDER");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pagePath, setPagePath] = useState(defaultPagePath || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setHistoryError("");
      const response = await fetch("/api/support/inquiries?limit=5");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "문의 내역을 불러오는데 실패했습니다.");
      }
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error("Support inquiry history error:", error);
      setHistoryError(error.message || "문의 내역을 불러오는 중 오류가 발생했습니다.");
      setInquiries([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    setPagePath(defaultPagePath || "");
  }, [defaultPagePath]);

  useEffect(() => {
    if (!isOpen) {
      setSubject("");
      setMessage("");
      setCategory("ORDER");
      setExpandedId(null);
      setIsHistoryDrawerOpen(false);
    } else {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  useEffect(() => {
    if (!isHistoryDrawerOpen) {
      setExpandedId(null);
    }
  }, [isHistoryDrawerOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setToast({ type: "error", message: "문의 제목과 내용을 입력해주세요." });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/support/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          pagePath: pagePath || defaultPagePath,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "문의 등록에 실패했습니다.");
      }

      setToast({ type: "success", message: "문의가 등록되었습니다. 빠르게 답변드릴게요!" });
      setSubject("");
      setMessage("");
      fetchHistory();
      setTimeout(() => {
        setToast(null);
      }, 1500);
    } catch (error) {
      console.error("Support inquiry submit error:", error);
      setToast({ type: "error", message: error.message || "문의 등록 중 오류가 발생했습니다." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl ring-1 ring-neutral-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#967d5a]">문의하기</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">어떤 도움이 필요하신가요?</h2>
          <p className="mt-2 text-sm text-slate-500">
            현재 페이지와 연결된 문의를 전달드려요. 최대한 빨리 답변드리겠습니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              문의 분류
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 focus:border-[#967d5a] focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              문의 제목
              <input
                type="text"
                value={subject}
                maxLength={120}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="문의 내용을 한 줄로 요약해주세요."
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              문의 상세 내용
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="상세 내용을 입력해주세요."
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-medium text-slate-500">
              관련 페이지 (선택)
              <input
                type="text"
                value={pagePath}
                onChange={(e) => setPagePath(e.target.value)}
                placeholder="자동으로 현재 경로가 입력됩니다."
                className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-2 text-xs text-slate-500 focus:border-[#967d5a] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#967d5a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7a6548] disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  전송 중...
                </>
              ) : (
                "문의 전송"
              )}
            </button>
          </form>

          {toast && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {toast.message}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-neutral-100 bg-neutral-50">
            <button
              type="button"
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#967d5a]" />
                최근 문의 내역
              </span>
              <span className="text-xs text-slate-500">팝업 열기</span>
            </button>
          </div>
        </div>
      </div>
      {isHistoryDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#967d5a]">문의 기록</p>
                <h3 className="text-lg font-semibold text-slate-900">최근 문의 내역</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 text-sm text-slate-600">
              {loadingHistory ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  불러오는 중...
                </div>
              ) : historyError ? (
                <p className="text-red-500">{historyError}</p>
              ) : inquiries.length === 0 ? (
                <p className="text-slate-400">등록된 문의가 없습니다.</p>
              ) : (
                <ul className="space-y-4">
                  {inquiries.map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                      <li key={item.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{formatCategory(item.category)}</span>
                            <span>{formatDateTime(item.created_at)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{item.subject}</p>
                            <span className="text-xs font-semibold text-slate-500">
                              상태: <StatusBadge status={item.status} />
                            </span>
                          </div>
                          <p className={`mt-1 text-xs text-slate-500 ${isExpanded ? "" : "line-clamp-2"}`}>
                            {item.message}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            자세히 {isExpanded ? "접기" : "보기"}
                          </p>
                        </button>
                        {isExpanded && (
                          <div className="mt-3 space-y-2 rounded-2xl bg-white px-3 py-3 text-xs text-slate-600">
                            {item.page_path && (
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-500">관련 페이지</span>
                                <span className="text-slate-700">{item.page_path}</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-500">문의 내용</p>
                              <p className="mt-1 whitespace-pre-wrap text-slate-700">{item.message}</p>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCategory(category) {
  const map = {
    ORDER: "주문 관리",
    NOTICE: "공지사항",
    QUALITY: "품질 점검",
    TRAINING: "교육 자료",
    ACCOUNT: "계정/권한",
    OTHER: "기타",
  };
  return map[category] || category;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }) {
  const tone =
    status === "RESOLVED" || status === "CLOSED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "IN_PROGRESS"
      ? "bg-blue-50 text-blue-700"
      : "bg-amber-50 text-amber-700";
  const labelMap = {
    OPEN: "접수됨",
    IN_PROGRESS: "처리중",
    RESOLVED: "완료",
    CLOSED: "종료",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{labelMap[status] || status}</span>;
}

