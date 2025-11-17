"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, X, CheckCircle2, Clock, FileText, ChevronDown, ChevronUp } from "lucide-react";

export default function InquiryPanel({ trainingMaterialId, isOpen, onClose }) {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [expandedInquiryId, setExpandedInquiryId] = useState(null);

  // 문의 내역 불러오기
  useEffect(() => {
    if (isOpen) {
      fetchInquiries();
    }
  }, [isOpen, trainingMaterialId]);

  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      // trainingMaterialId가 있으면 해당 교육 자료의 문의만, 없으면 모든 문의 조회
      const url = trainingMaterialId
        ? `/api/training-inquiries?trainingMaterialId=${trainingMaterialId}`
        : `/api/training-inquiries`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 내역을 불러오는데 실패했습니다.");
      }

      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error("Fetch inquiries error:", error);
      // 에러가 발생해도 계속 진행 (문의 등록은 가능하도록)
    } finally {
      setLoadingInquiries(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      alert("문의 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/training-inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainingMaterialId,
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 등록에 실패했습니다.");
      }

      setSubmitted(true);
      setQuestion("");
      // 문의 내역 새로고침
      await fetchInquiries();
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Submit inquiry error:", error);
      alert(error.message || "문의 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "답변 대기";
      case "ANSWERED":
        return "답변 완료";
      case "CLOSED":
        return "완료";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ANSWERED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900">문의하기</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-neutral-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <p>교육 자료에 대한 문의사항을 남겨주세요.</p>
          <p className="mt-1 text-xs text-blue-600">관리자가 확인 후 답변드리겠습니다.</p>
        </div>

        {submitted && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <span>문의가 등록되었습니다.</span>
          </div>
        )}

        {/* 문의 내역 */}
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            {trainingMaterialId ? "내 문의 내역" : "전체 문의 내역"}
          </h4>
          {loadingInquiries ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#967d5a]"></div>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-slate-500">
              등록된 문의가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="rounded-lg border border-neutral-200 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedInquiryId(
                        expandedInquiryId === inquiry.id ? null : inquiry.id
                      )
                    }
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-neutral-50 transition"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {inquiry.question.length > 30
                            ? `${inquiry.question.substring(0, 30)}...`
                            : inquiry.question}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(
                          inquiry.status
                        )}`}
                      >
                        {getStatusLabel(inquiry.status)}
                      </span>
                      {expandedInquiryId === inquiry.id ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {expandedInquiryId === inquiry.id && (
                    <div className="border-t border-neutral-200 p-4 space-y-4">
                      {inquiry.trainingMaterial && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">교육 자료</p>
                          <p className="text-sm font-medium text-slate-900">
                            {inquiry.trainingMaterial.title}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">문의 내용</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {inquiry.question}
                        </p>
                      </div>

                      {inquiry.answer ? (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <p className="text-xs font-medium text-green-800">관리자 답변</p>
                            {inquiry.answeredAt && (
                              <span className="text-xs text-green-600 ml-auto">
                                {new Date(inquiry.answeredAt).toLocaleDateString("ko-KR")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-green-900 whitespace-pre-wrap">
                            {inquiry.answer}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <p className="text-xs text-yellow-800">답변 대기 중입니다.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 문의 등록 폼 - trainingMaterialId가 있을 때만 표시 */}
        {trainingMaterialId && (
          <div className="border-t border-neutral-200 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-900">새 문의 등록</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="question" className="mb-2 block text-sm font-medium text-slate-700">
                문의 내용
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20 resize-none"
                placeholder="문의 내용을 입력하세요..."
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !question.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>등록 중...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>문의 등록</span>
                </>
              )}
            </button>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}

