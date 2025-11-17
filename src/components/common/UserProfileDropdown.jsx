"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserCircle2, User, LogOut, FileText } from "lucide-react";

export default function UserProfileDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUser();
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchUser = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, name, role, status")
          .eq("id", authUser.id)
          .single();

        if (userData) {
          setUser({
            ...userData,
            email: authUser.email,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      ADMIN: "관리자",
      OWNER: "가맹점주",
      STAFF: "직원",
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 hover:border-[#967d5a] hover:text-[#967d5a]"
        disabled
      >
        <UserCircle2 className="h-5 w-5" />
      </button>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 hover:border-[#967d5a] hover:text-[#967d5a] transition-colors"
      >
        <UserCircle2 className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 bg-white shadow-lg z-50">
          {/* 사용자 정보 섹션 */}
          <div className="border-b border-neutral-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#967d5a]/10">
                <User className="h-5 w-5 text-[#967d5a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.name || "사용자"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <p className="text-xs text-[#967d5a] font-medium mt-1">
                  {getRoleLabel(user.role)}
                </p>
              </div>
            </div>
          </div>

          {/* 메뉴 항목 */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // 프로필 페이지로 이동 (추후 구현)
                router.push("/profile");
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-neutral-50 transition-colors"
            >
              <User className="h-4 w-4 text-slate-400" />
              프로필
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                // 내 페이지로 이동 (추후 구현)
                router.push("/mypage");
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-neutral-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-slate-400" />
              내 페이지
            </button>
          </div>

          {/* 로그아웃 */}
          <div className="border-t border-neutral-200 py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

