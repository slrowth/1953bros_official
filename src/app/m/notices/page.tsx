/**
 * 모바일 공지사항 목록 페이지
 * 공지사항 목록 조회
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pin, Eye, Calendar, User, Bell, CheckCircle2 } from "lucide-react";
import MobileLayout from "@/components/mobile/MobileLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { formatDateKorean } from "@/utils/formatDate";

export default function MobileNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/notices");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "공지사항을 불러오는데 실패했습니다.");
      }

      setNotices(data.notices || []);
    } catch (err) {
      console.error("Notices fetch error:", err);
      setError(err.message || "공지사항을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notices.filter((notice) => !notice.isRead).length;

  // 읽지 않은 공지사항을 먼저, 읽은 공지사항을 나중에 표시
  const sortedNotices = [...notices].sort((a, b) => {
    // 고정 공지사항은 항상 최상단
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    // 읽지 않은 공지사항을 먼저
    if (!a.isRead && b.isRead) return -1;
    if (a.isRead && !b.isRead) return 1;
    // 나머지는 날짜순 (최신순)
    return new Date(b.published_at) - new Date(a.published_at);
  });

  return (
    <MobileLayout
      title="공지사항"
      headerRightAction={
        unreadCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white">
            <Bell className="h-3 w-3" />
            <span>{unreadCount}</span>
          </div>
        )
      }
    >
      <div className="flex flex-col">
        {loading ? (
          <LoadingSpinner message="공지사항을 불러오는 중..." />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={fetchNotices} />
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Bell className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-900">등록된 공지사항이 없습니다</p>
          </div>
        ) : (
          <div className="px-4 pt-4 pb-4 space-y-3">
            {sortedNotices.map((notice) => (
              <button
                key={notice.id}
                onClick={() => router.push(`/m/notices/${notice.id}`)}
                className={`w-full rounded-2xl border p-4 text-left shadow-sm transition active:bg-neutral-50 ${
                  notice.isRead
                    ? "border-neutral-200 bg-neutral-50 opacity-75"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      {notice.is_pinned && (
                        <Pin className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
                      )}
                      <h3
                        className={`font-semibold leading-tight break-words ${
                          notice.isRead
                            ? "text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {notice.title}
                      </h3>
                      {!notice.isRead && (
                        <span className="shrink-0 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          NEW
                        </span>
                      )}
                      {notice.isRead && (
                        <span className="shrink-0 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          <CheckCircle2 className="h-3 w-3" />
                          읽음
                        </span>
                      )}
                    </div>
                    <p
                      className={`mb-3 line-clamp-2 text-sm leading-relaxed ${
                        notice.isRead ? "text-slate-500" : "text-slate-600"
                      }`}
                    >
                      {notice.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {notice.author?.name ||
                            notice.author?.email ||
                            "관리자"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateKorean(notice.published_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>
                          {notice.audience === "ALL"
                            ? "전체"
                            : notice.audience === "FRANCHISEE"
                            ? "가맹점주"
                            : "직원"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
