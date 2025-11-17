"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, CheckCircle2, XCircle, Minus } from "lucide-react";

export default function ChecklistDetailPage() {
  const router = useRouter();
  const params = useParams();
  const checklistId = params.id;
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (checklistId) {
      fetchChecklist();
    }
  }, [checklistId]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/quality/checklists/${checklistId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "체크리스트를 불러오는데 실패했습니다.");
      }

      setChecklist(data.checklist);
    } catch (err) {
      console.error("Fetch checklist error:", err);
      setError(err.message || "체크리스트를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">체크리스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error || "체크리스트를 찾을 수 없습니다."}
        </div>
        <Link
          href="/admin/quality/checklists"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/quality/checklists"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
        <Link
          href={`/admin/quality/checklists/${checklistId}/edit`}
          className="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#967d5a]/90"
        >
          <Edit className="h-4 w-4" />
          수정
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{checklist.title}</h1>
            {checklist.description && (
              <p className="mt-2 text-slate-600">{checklist.description}</p>
            )}
          </div>
          {checklist.isActive ? (
            <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">활성</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
              <XCircle className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">비활성</span>
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 border-t border-b border-neutral-200 py-4">
          <div>
            <span className="text-sm text-slate-600">버전</span>
            <p className="mt-1 text-lg font-semibold text-slate-900">v{checklist.version}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">항목 수</span>
            <p className="mt-1 text-lg font-semibold text-slate-900">{checklist.items?.length || 0}개</p>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">점검 항목</h2>
          <div className="space-y-3">
            {checklist.items && checklist.items.length > 0 ? (
              checklist.items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#967d5a] text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-slate-900">{item.label}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-slate-500">항목이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

