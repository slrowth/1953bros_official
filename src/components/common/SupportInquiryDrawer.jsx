"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

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

  useEffect(() => {
    setPagePath(defaultPagePath || "");
  }, [defaultPagePath]);

  useEffect(() => {
    if (!isOpen) {
      setSubject("");
      setMessage("");
      setCategory("ORDER");
    }
  }, [isOpen]);

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
      setTimeout(() => {
        setToast(null);
        onClose?.();
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
        </div>
      </div>
    </div>
  );
}

