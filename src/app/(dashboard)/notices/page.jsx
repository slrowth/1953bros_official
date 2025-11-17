"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pin, Eye, Calendar, User } from "lucide-react";

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchNotices();
    fetchUserRole();
  }, []);

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

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notices");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "공지사항을 불러오는데 실패했습니다.");
      }

      setNotices(data.notices || []);
    } catch (error) {
      console.error("Notices fetch error:", error);
      alert(error.message || "공지사항을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">공지사항</h1>
            <p className="mt-1 text-sm text-slate-500">
              중요한 공지사항을 확인하세요
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/admin/notices/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#967d5a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7a6548]"
            >
              <Plus className="h-4 w-4" />
              공지사항 등록
            </Link>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          {notices.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400">등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/notices/${notice.id}`}
                  className="block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#967d5a] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {notice.is_pinned && (
                          <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
                        )}
                        <h3
                          className={`text-lg font-semibold ${
                            notice.isRead
                              ? "text-slate-600"
                              : "text-slate-900"
                          }`}
                        >
                          {notice.title}
                        </h3>
                        {!notice.isRead && (
                          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                        {notice.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
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
                          <span>{formatDate(notice.published_at)}</span>
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

