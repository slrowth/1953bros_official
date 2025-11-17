"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Store, Building2, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Edit2, Trash2, Plus, User, Phone } from "lucide-react";

const AUDIENCE_OPTIONS = {
  ALL: { label: "전체", color: "bg-blue-100 text-blue-800" },
  FRANCHISEE: { label: "가맹점", color: "bg-purple-100 text-purple-800" },
  STAFF: { label: "직원", color: "bg-green-100 text-green-800" },
};

export default function NoticeReadStatusPage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedNotices, setExpandedNotices] = useState({});
  const [expandedStores, setExpandedStores] = useState({}); // 매장별 펼침 상태
  const [deletingNoticeId, setDeletingNoticeId] = useState(null);

  useEffect(() => {
    fetchReadStatus();
  }, []);

  const fetchReadStatus = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/notices/read-status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "공지사항 확인여부를 불러오는데 실패했습니다.");
      }

      setNotices(data.notices || []);
    } catch (err) {
      console.error("Fetch read status error:", err);
      setError(err.message || "공지사항 확인여부를 불러오는 중 오류가 발생했습니다.");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotice = (noticeId) => {
    setExpandedNotices((prev) => ({
      ...prev,
      [noticeId]: !prev[noticeId],
    }));
  };

  const toggleStore = (storeKey) => {
    setExpandedStores((prev) => ({
      ...prev,
      [storeKey]: !prev[storeKey],
    }));
  };

  const getAudienceBadge = (audience) => {
    const option = AUDIENCE_OPTIONS[audience];
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${option?.color || "bg-gray-100 text-gray-800"}`}
      >
        {option?.label || audience}
      </span>
    );
  };

  const handleDelete = async (noticeId, noticeTitle) => {
    if (!confirm(`"${noticeTitle}" 공지사항을 삭제하시겠습니까?\n삭제된 공지사항은 복구할 수 없습니다.`)) {
      return;
    }

    try {
      setDeletingNoticeId(noticeId);

      const response = await fetch(`/api/notices/${noticeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "공지사항 삭제에 실패했습니다.");
      }

      alert("공지사항이 삭제되었습니다.");
      await fetchReadStatus();
    } catch (err) {
      console.error("Delete notice error:", err);
      alert(err.message || "공지사항 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingNoticeId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">공지사항 확인여부를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const totalNotices = notices.length;
  const totalUnreadStores = notices.reduce((sum, notice) => sum + notice.unreadStoresCount, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">공지사항 관리</h1>
          <p className="mt-1 text-sm text-slate-500">각 공지사항별로 미확인 매장 정보를 확인할 수 있습니다.</p>
        </div>
        <Link
          href="/admin/notices/new"
          className="flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
        >
          <Plus className="h-4 w-4" />
          공지사항 등록
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">전체 공지사항</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totalNotices}개</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">미확인 매장 수</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totalUnreadStores}개</p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">평균 확인률</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {totalNotices > 0
                  ? Math.round(
                      (notices.reduce((sum, notice) => sum + (notice.readStores / Math.max(notice.totalStores, 1)) * 100, 0) /
                        totalNotices)
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* 공지사항 목록 */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-900">공지사항이 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          notices.map((notice) => {
            const isExpanded = expandedNotices[notice.id];
            const hasUnreadStores = notice.unreadStoresCount > 0;

            return (
              <div
                key={notice.id}
                className={`rounded-2xl border shadow-sm overflow-hidden ${
                  hasUnreadStores
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                {/* 공지사항 헤더 */}
                <div className="flex items-center gap-4 p-6">
                  <button
                    type="button"
                    onClick={() => toggleNotice(notice.id)}
                    className="flex-1 flex items-center justify-between text-left transition hover:bg-opacity-80"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {notice.isPinned && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            고정
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-slate-900">{notice.title}</h3>
                        {getAudienceBadge(notice.audience)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>
                          발행일: {new Date(notice.publishedAt).toLocaleDateString("ko-KR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Store className="h-4 w-4" />
                          전체: {notice.totalStores}개 매장
                        </span>
                        <span className={`flex items-center gap-1 ${hasUnreadStores ? "text-yellow-700" : "text-green-700"}`}>
                          {hasUnreadStores ? (
                            <>
                              <AlertCircle className="h-4 w-4" />
                              미확인: {notice.unreadStoresCount}개 매장
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              모두 확인 완료
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/notices/new?id=${notice.id}`}
                      className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                    >
                      <Edit2 className="h-4 w-4" />
                      수정
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notice.id, notice.title);
                      }}
                      disabled={deletingNoticeId === notice.id}
                      className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingNoticeId === notice.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>

                {/* 미확인 매장 목록 */}
                {isExpanded && (
                  <div className="border-t bg-white p-6">
                    {notice.unreadStoresCount === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                        <p className="mt-4 text-sm font-medium text-slate-900">모든 매장이 확인했습니다</p>
                        <p className="mt-1 text-sm text-slate-500">이 공지사항은 모든 대상 매장에서 확인되었습니다.</p>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900">
                            미확인 매장 ({notice.unreadStoresCount}개)
                          </h4>
                          <span className="text-xs text-slate-500">
                            확인률: {notice.totalStores > 0 ? Math.round((notice.readStores / notice.totalStores) * 100) : 0}%
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {notice.unreadStores.map((store) => {
                            const storeKey = `${notice.id}-${store.storeId}`;
                            const isStoreExpanded = expandedStores[storeKey];
                            
                            return (
                              <div
                                key={store.storeId}
                                className="rounded-lg border border-yellow-200 bg-yellow-50 overflow-hidden"
                              >
                                <div
                                  className="p-4 cursor-pointer hover:bg-yellow-100 transition-colors"
                                  onClick={() => toggleStore(storeKey)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Store className="h-4 w-4 text-yellow-700" />
                                        <span className="text-sm font-semibold text-slate-900">{store.storeName}</span>
                                      </div>
                                      {store.franchiseName && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                          <Building2 className="h-3 w-3" />
                                          <span>{store.franchiseName}</span>
                                        </div>
                                      )}
                                      <div className="mt-2 text-xs text-slate-500">
                                        미확인 사용자: {store.unreadUsersCount}명
                                      </div>
                                    </div>
                                    <div className="ml-2 flex-shrink-0">
                                      {isStoreExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 미확인 사용자 목록 */}
                                {isStoreExpanded && store.unreadUsers && store.unreadUsers.length > 0 && (
                                  <div className="border-t border-yellow-200 bg-white p-4">
                                    <div className="space-y-2">
                                      {store.unreadUsers.map((user) => (
                                        <div
                                          key={user.id}
                                          className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3"
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <User className="h-3 w-3 text-slate-400" />
                                              <span className="text-sm font-medium text-slate-900">{user.name}</span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                                              <Phone className="h-3 w-3 text-slate-400" />
                                              <span>{user.phone}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
