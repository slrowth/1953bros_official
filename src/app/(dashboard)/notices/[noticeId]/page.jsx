"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Pin,
  Calendar,
  User,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const noticeId = params.noticeId;
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    if (noticeId) {
      fetchNotice();
      fetchUserRole();
    }
  }, [noticeId]);

  const fetchUserRole = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserRole(userData.role);
        }
      }
    } catch (error) {
      console.error("User role fetch error:", error);
    }
  };

  const fetchNotice = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error("Notice fetch error:", error);
      alert(error.message || "공지사항을 불러오는데 실패했습니다.");
      router.push("/notices");
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

  const handleDelete = async () => {
    if (!confirm("정말 이 공지사항을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "공지사항 삭제에 실패했습니다.");
      }

      alert("공지사항이 삭제되었습니다.");
      router.push("/notices");
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message || "공지사항 삭제에 실패했습니다.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAdmin = userRole === "ADMIN";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mb-4 text-lg font-medium text-slate-600">
            공지사항을 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-slate-400">공지사항을 찾을 수 없습니다.</p>
          <Link
            href="/notices"
            className="mt-4 inline-block text-[#967d5a] hover:underline"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/notices/${noticeId}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-[#967d5a] bg-white px-4 py-2 text-sm font-medium text-[#967d5a] transition hover:bg-[#967d5a] hover:text-white"
              >
                <Edit className="h-4 w-4" />
                수정
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </button>
            </div>
          )}
        </div>

        <article className="rounded-3xl bg-white p-8 shadow-sm">
          <header className="mb-6 border-b border-neutral-200 pb-6">
            <div className="mb-4 flex items-center gap-2">
              {notice.is_pinned && (
                <Pin className="h-5 w-5 text-amber-500 fill-amber-500" />
              )}
              <h1 className="text-3xl font-bold text-slate-900">
                {notice.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {notice.author?.name ||
                    notice.author?.email ||
                    "관리자"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(notice.published_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>
                  {notice.audience === "ALL"
                    ? "전체"
                    : notice.audience === "FRANCHISEE"
                    ? "가맹점주"
                    : "직원"}
                </span>
              </div>
              {isRead && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  읽음
                </span>
              )}
            </div>
          </header>

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {notice.content}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

