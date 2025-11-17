"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, CheckCircle2, Clock, X, Send, User, Building2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "대기중", color: "bg-yellow-100 text-yellow-800" },
  { value: "ANSWERED", label: "답변완료", color: "bg-green-100 text-green-800" },
  { value: "CLOSED", label: "종료", color: "bg-gray-100 text-gray-800" },
];

export default function TrainingInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materials, setMaterials] = useState([]);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    fetchInquiries();
    fetchMaterials();
  }, [selectedStatus, selectedMaterialId]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedMaterialId) params.append("trainingMaterialId", selectedMaterialId);

      const response = await fetch(`/api/training-inquiries?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 목록을 불러오는데 실패했습니다.");
      }

      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error("Fetch inquiries error:", error);
      alert(error.message || "문의 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/training-materials");
      const data = await response.json();

      if (response.ok) {
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error("Fetch materials error:", error);
    }
  };

  const handleStartAnswer = (inquiry) => {
    setEditingInquiry(inquiry);
    setAnswerText(inquiry.answer || "");
  };

  const handleCancelAnswer = () => {
    setEditingInquiry(null);
    setAnswerText("");
  };

  const handleSaveAnswer = async () => {
    if (!editingInquiry) return;

    try {
      setSaving(editingInquiry.id);
      const response = await fetch(`/api/training-inquiries/${editingInquiry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: answerText.trim(),
          status: answerText.trim() ? "ANSWERED" : "PENDING",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "답변 저장에 실패했습니다.");
      }

      alert("답변이 저장되었습니다.");
      handleCancelAnswer();
      await fetchInquiries();
    } catch (error) {
      console.error("Save answer error:", error);
      alert(error.message || "답변 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(null);
    }
  };

  const handleCloseInquiry = async (inquiryId) => {
    if (!confirm("이 문의를 종료하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/training-inquiries/${inquiryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CLOSED",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 종료에 실패했습니다.");
      }

      await fetchInquiries();
    } catch (error) {
      console.error("Close inquiry error:", error);
      alert(error.message || "문의 종료 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option ? (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${option.color}`}>{option.label}</span>
    ) : (
      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">{status}</span>
    );
  };

  const pendingCount = inquiries.filter((i) => i.status === "PENDING").length;
  const answeredCount = inquiries.filter((i) => i.status === "ANSWERED").length;
  const totalCount = inquiries.length;

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">교육 자료 문의 관리</h1>
            <p className="mt-1 text-sm text-slate-500">교육 자료에 대한 문의사항을 확인하고 답변할 수 있습니다.</p>
          </div>
          <Link
            href="/admin/training/new"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
          >
            <ArrowLeft className="h-4 w-4" />
            교육 자료로
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-700">대기중</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-700">답변완료</p>
                <p className="text-2xl font-bold text-green-900">{answeredCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-slate-600" />
              <div>
                <p className="text-sm text-slate-700">전체</p>
                <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">상태:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            >
              <option value="">전체</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">교육 자료:</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            >
              <option value="">전체</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 문의 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
              <p className="mt-4 text-sm text-slate-500">문의 목록을 불러오는 중...</p>
            </div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-slate-500">문의가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => {
              const isEditing = editingInquiry?.id === inquiry.id;
              return (
                <div
                  key={inquiry.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(inquiry.status)}
                        <span className="text-sm text-slate-500">
                          {inquiry.trainingMaterial?.title || "알 수 없음"}
                        </span>
                      </div>
                      <div className="mb-3 flex items-center gap-4 text-sm text-slate-600">
                        {inquiry.user && (
                          <>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{inquiry.user.name || inquiry.user.email}</span>
                            </div>
                            {inquiry.user.storeName && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                <span>{inquiry.user.storeName}</span>
                              </div>
                            )}
                          </>
                        )}
                        <span className="text-slate-400">
                          {new Date(inquiry.createdAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                      <div className="mb-4 rounded-lg bg-neutral-50 p-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">문의 내용</p>
                        <p className="text-sm text-slate-900 whitespace-pre-wrap">{inquiry.question}</p>
                      </div>
                      {isEditing ? (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-slate-700">답변</label>
                          <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20 resize-none"
                            placeholder="답변을 입력하세요..."
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSaveAnswer}
                              disabled={saving === inquiry.id}
                              className="flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548] disabled:opacity-50"
                            >
                              <Send className="h-4 w-4" />
                              {saving === inquiry.id ? "저장 중..." : "답변 저장"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelAnswer}
                              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {inquiry.answer && (
                            <div className="mb-4 rounded-lg bg-green-50 p-4">
                              <p className="text-sm font-medium text-green-700 mb-2">답변</p>
                              <p className="text-sm text-green-900 whitespace-pre-wrap">{inquiry.answer}</p>
                              {inquiry.answeredBy && (
                                <p className="mt-2 text-xs text-green-600">
                                  {inquiry.answeredBy.name || inquiry.answeredBy.email} ·{" "}
                                  {inquiry.answeredAt
                                    ? new Date(inquiry.answeredAt).toLocaleString("ko-KR")
                                    : "알 수 없음"}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {inquiry.status !== "CLOSED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartAnswer(inquiry)}
                                  className="flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
                                >
                                  <Send className="h-4 w-4" />
                                  {inquiry.answer ? "답변 수정" : "답변하기"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCloseInquiry(inquiry.id)}
                                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                                >
                                  <X className="h-4 w-4" />
                                  종료
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

