"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  BookOpen,
  ClipboardList,
  Home,
  Package,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import UserProfileDropdown from "@/components/common/UserProfileDropdown";

const navItems = [
  {
    name: "주문 관리",
    href: "/products",
    icon: ShoppingCart,
  },
  {
    name: "공지사항",
    href: "/notices",
    icon: ClipboardList,
  },
  {
    name: "품질 점검",
    href: "/quality",
    icon: ShieldCheck,
  },
  {
    name: "교육 자료",
    href: "/training",
    icon: BookOpen,
  },
];

export default function DashboardLayoutClient({ children }) {
  const pathname = usePathname();
  const [storeName, setStoreName] = useState("지점 정보를 불러오는 중...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const fetchStoreInfo = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setStoreName("지점 정보 없음");
        setLoading(false);
        return;
      }

      // 사용자 정보 조회
      const { data: userData } = await supabase
        .from("users")
        .select("store_id, store_name")
        .eq("id", authUser.id)
        .single();

      if (!userData) {
        setStoreName("지점 정보 없음");
        setLoading(false);
        return;
      }

      // 우선순위: store_id > store_name
      if (userData.store_id) {
        // store_id가 있으면 stores 테이블에서 매장 정보를 가져옴
        const { data: storeData } = await supabase
          .from("stores")
          .select("name")
          .eq("id", userData.store_id)
          .eq("is_active", true)
          .single();

        if (storeData) {
          setStoreName(storeData.name);
        } else if (userData.store_name) {
          // 매장 정보를 찾을 수 없으면 store_name 사용 (하위 호환성)
          setStoreName(userData.store_name);
        } else {
          setStoreName("지점 정보 없음");
        }
      } else if (userData.store_name) {
        // store_id가 없으면 store_name 사용 (하위 호환성)
        setStoreName(userData.store_name);
      } else {
        setStoreName("지점 정보 없음");
      }
    } catch (error) {
      console.error("Error fetching store info:", error);
      setStoreName("지점 정보 불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-neutral-200 bg-white px-6 py-8 lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Home className="h-5 w-5 text-[#967d5a]" />
          1953형제돼지국밥 프랜차이즈 플랫폼
        </Link>
        <p className="mt-6 text-xs font-medium uppercase text-slate-400">메뉴</p>
        <nav className="mt-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#967d5a] text-white shadow-sm"
                    : "text-slate-600 hover:bg-[#967d5a]/10 hover:text-[#967d5a]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-6 py-5 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">
              {loading ? "지점 정보를 불러오는 중..." : storeName}
            </span>
            <span className="mx-2 text-slate-300">•</span>
      
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 hover:border-[#967d5a] hover:text-[#967d5a]"
            >
              <Bell className="h-5 w-5" />
            </button>
            <UserProfileDropdown />
          </div>
        </header>
        <div className="flex-1 w-full">{children}</div>
      </main>
    </div>
  );
}