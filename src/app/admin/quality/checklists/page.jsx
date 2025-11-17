"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, Search, CheckCircle2, XCircle } from "lucide-react";

export default function ChecklistsPage() {
  const router = useRouter();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/quality/checklists");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "체크리스트 목록을 불러오는데 실패했습니다.");
      }

      setChecklists(data.checklists || []);
    } catch (err) {
      console.error("Fetch checklists error:", err);
      setError(err.message || "체크리스트 목록을 불러오는 중 오류가 발생했습니다.");
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("정말 이 체크리스트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/quality/checklists/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "체크리스트 삭제에 실패했습니다.");
      }

      alert("체크리스트가 삭제되었습니다.");
      fetchChecklists();
    } catch (err) {
      console.error("Delete checklist error:", err);
      alert(err.message || "체크리스트 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredChecklists = checklists.filter((checklist) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        checklist.title?.toLowerCase().includes(query) ||
        checklist.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

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

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">체크리스트 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              품질점검에 사용할 체크리스트를 관리하세요
            </p>
          </div>
          <Link
            href="/admin/quality/checklists/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#967d5a]/90"
          >
            <Plus className="h-4 w-4" />
            체크리스트 등록
          </Link>
        </div>
      </div>

      {/* 검색 */}
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="체크리스트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 체크리스트 목록 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredChecklists.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">체크리스트가 없습니다.</p>
          </div>
        ) : (
          filteredChecklists.map((checklist) => (
            <div
              key={checklist.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{checklist.title}</h3>
                  {checklist.description && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{checklist.description}</p>
                  )}
                </div>
                {checklist.isActive ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-300" />
                )}
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">항목 수</span>
                  <span className="font-medium text-slate-900">{checklist.items?.length || 0}개</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">버전</span>
                  <span className="font-medium text-slate-900">v{checklist.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">상태</span>
                  <span
                    className={`font-medium ${
                      checklist.isActive ? "text-green-600" : "text-slate-400"
                    }`}
                  >
                    {checklist.isActive ? "활성" : "비활성"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/quality/checklists/${checklist.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                >
                  <Eye className="h-4 w-4" />
                  상세보기
                </Link>
                <Link
                  href={`/admin/quality/checklists/${checklist.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                >
                  <Edit className="h-4 w-4" />
                  수정
                </Link>
                <button
                  onClick={() => handleDelete(checklist.id)}
                  disabled={deletingId === checklist.id}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

