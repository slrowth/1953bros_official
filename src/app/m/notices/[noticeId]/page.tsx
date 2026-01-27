/**
 * 모바일 공지사항 상세 페이지
 * 공지사항 상세 내용 조회
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Pin, Calendar, User, Eye } from "lucide-react";
import MobileLayout from "@/components/mobile/MobileLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import { formatDateKorean } from "@/utils/formatDate";

export default function MobileNoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const noticeId = params.noticeId;
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    if (noticeId) {
      fetchNotice();
    }
  }, [noticeId]);

  const fetchNotice = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/notices/${noticeId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "공지사항을 불러오는데 실패했습니다.");
      }

      setNotice(data.notice);
      setIsRead(data.notice.isRead || false);

      // 읽지 않은 경우 읽음 처리
      if (!data.notice.isRead) {
        await markAsRead();
      }
    } catch (err) {
      console.error("Notice fetch error:", err);
      setError(err.message || "공지사항을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const response = await fetch(`/api/notices/${noticeId}/read`, {
        method: "POST",
      });

      if (response.ok) {
        setIsRead(true);
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  return (
    <MobileLayout title="공지사항" backHref="/m/notices">
      <div className="flex flex-col">
        {loading ? (
          <LoadingSpinner message="공지사항을 불러오는 중..." />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={fetchNotice} />
          </div>
        ) : !notice ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <p className="text-sm font-medium text-slate-900">공지사항을 찾을 수 없습니다</p>
            <button
              onClick={() => router.push("/m/notices")}
              className="mt-4 text-sm text-[#967d5a] font-medium"
            >
              목록으로 돌아가기
            </button>
          </div>
        ) : (
          <div className="px-4 pt-4 pb-4">
            {/* 헤더 정보 */}
            <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                {notice.is_pinned && (
                  <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
                )}
                <h1 className="flex-1 font-semibold text-slate-900 leading-tight break-words">
                  {notice.title}
                </h1>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>
                    {notice.author?.name ||
                      notice.author?.email ||
                      "관리자"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>{formatDateKorean(notice.published_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3 text-slate-400" />
                  <span>
                    {notice.audience === "ALL"
                      ? "전체"
                      : notice.audience === "FRANCHISEE"
                      ? "가맹점주"
                      : "직원"}
                  </span>
                </div>
                {isRead && (
                  <div className="pt-1">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                      읽음
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 본문 내용 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                {notice.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
