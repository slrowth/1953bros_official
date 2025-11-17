"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewNoticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeId = searchParams.get("id");
  const isEditMode = !!noticeId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "ALL",
    isPinned: false,
  });

  useEffect(() => {
    if (isEditMode) {
      fetchNotice();
    }
  }, [noticeId]);

  const fetchNotice = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/notices/${noticeId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "공지사항을 불러오는데 실패했습니다.");
      }

      setFormData({
        title: data.notice.title || "",
        content: data.notice.content || "",
        audience: data.notice.audience || "ALL",
        isPinned: data.notice.is_pinned || false,
      });
    } catch (error) {
      console.error("Fetch notice error:", error);
      alert(error.message || "공지사항을 불러오는 중 오류가 발생했습니다.");
      router.push("/admin/notices/read-status");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditMode ? `/api/notices/${noticeId}` : "/api/notices";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isEditMode ? "공지사항 수정에 실패했습니다." : "공지사항 등록에 실패했습니다."));
      }

      alert(isEditMode ? "공지사항이 수정되었습니다." : "공지사항이 등록되었습니다.");
      router.push("/admin/notices/read-status");
    } catch (error) {
      console.error(isEditMode ? "Update notice error:" : "Create notice error:", error);
      alert(error.message || (isEditMode ? "공지사항 수정에 실패했습니다." : "공지사항 등록에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/notices/read-status"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-3xl font-bold text-slate-900">
            {isEditMode ? "공지사항 수정" : "공지사항 등록"}
          </h1>

          {fetching && (
            <div className="mb-6 flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#967d5a] mx-auto"></div>
                <p className="mt-4 text-sm text-slate-500">공지사항을 불러오는 중...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" style={{ display: fetching ? "none" : "block" }}>
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={12}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>

            <div>
              <label
                htmlFor="audience"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                대상 <span className="text-red-500">*</span>
              </label>
              <select
                id="audience"
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
              >
                <option value="ALL">전체</option>
                <option value="FRANCHISEE">가맹점주</option>
                <option value="STAFF">직원</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPinned"
                name="isPinned"
                checked={formData.isPinned}
                onChange={handleChange}
                className="h-5 w-5 rounded border-neutral-300 text-[#967d5a] focus:ring-[#967d5a]"
              />
              <label
                htmlFor="isPinned"
                className="text-sm font-medium text-slate-700"
              >
                상단 고정
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/admin/notices/read-status"
                className="rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-neutral-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading || fetching}
                className="inline-flex items-center gap-2 rounded-xl bg-[#967d5a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7a6548] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? (isEditMode ? "수정 중..." : "등록 중...") : (isEditMode ? "수정" : "등록")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

