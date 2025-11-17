"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Filter, MessageSquare, ExternalLink } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "OPEN", label: "접수됨" },
  { value: "IN_PROGRESS", label: "처리중" },
  { value: "RESOLVED", label: "완료" },
  { value: "CLOSED", label: "종료" },
];

const STATUS_BADGE = {
  OPEN: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-neutral-100 text-neutral-700",
};

export default function AdminSupportInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [searchValue, setSearchValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, keyword]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (keyword.trim()) {
        params.set("search", keyword.trim());
      }
      const response = await fetch(`/api/support/inquiries?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "문의 내역을 불러오는데 실패했습니다.");
      }
      setInquiries(data.inquiries || []);
    } catch (err) {
      console.error("Admin fetch inquiries error:", err);
      setError(err.message || "문의 내역을 불러오는 중 오류가 발생했습니다.");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchValue);
  };

  const handleStatusChange = async (id, nextStatus) => {
    if (!nextStatus) return;
    try {
      setUpdatingId(id);
      const response = await fetch(`/api/support/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "문의 상태 변경에 실패했습니다.");
      }
      setInquiries((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    } catch (err) {
      alert(err.message || "문의 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingId("");
    }
  };

  const statusSummary = useMemo(() => {
    return inquiries.reduce(
      (acc, inquiry) => {
        acc.total += 1;
        acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );
  }, [inquiries]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#967d5a]">문의 관리</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">문의 내역 관리</h1>
          <p className="mt-1 text-sm text-slate-500">가맹점에서 제출한 모든 문의를 확인하고 처리 상태를 관리하세요.</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#967d5a] hover:text-[#967d5a]"
        >
          <ExternalLink className="h-4 w-4" />
          대시보드로 이동
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) => (
          <div key={status} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{STATUS_OPTIONS.find((item) => item.value === status)?.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{statusSummary[status] || 0}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-slate-500">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              placeholder="문의 제목, 내용, 페이지 경로 검색"
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
              <Filter className="h-4 w-4 text-slate-400" />
              상태
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-[#967d5a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7a6548]"
            >
              검색
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">문의 목록</h2>
          <p className="text-sm text-slate-500">총 {statusSummary.total || 0}건</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            문의 내역을 불러오는 중...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-12 text-center text-sm text-slate-400">
            표시할 문의가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <article key={inquiry.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{formatCategory(inquiry.category)}</span>
                      <span>·</span>
                      <span>{formatDateTime(inquiry.created_at)}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{inquiry.subject}</h3>
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{inquiry.message}</p>
                    {inquiry.page_path && (
                      <p className="mt-2 text-xs text-slate-400">페이지: {inquiry.page_path}</p>
                    )}
                    {inquiry.user && (
                      <p className="mt-1 text-xs text-slate-400">
                        문의자: {inquiry.user.name || inquiry.user.email} ({inquiry.user.store_name || "매장 정보 없음"})
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-right md:items-end">
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[inquiry.status]}`}>
                      {STATUS_OPTIONS.find((item) => item.value === inquiry.status)?.label}
                    </span>
                    <select
                      value={inquiry.status}
                      onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                      disabled={updatingId === inquiry.id}
                      className="mt-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-[#967d5a] focus:outline-none"
                    >
                      {STATUS_OPTIONS.filter((item) => item.value !== "ALL").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
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
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

