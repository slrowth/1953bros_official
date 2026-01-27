/**
 * 모바일 하단 네비게이션 컴포넌트
 * 주요 메뉴로 이동할 수 있는 하단 고정 네비게이션
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, ShoppingCart, ClipboardList, CheckSquare, Bell } from "lucide-react";

interface NavItem {
  /**
   * 메뉴 라벨
   */
  label: string;
  /**
   * 이동할 경로
   */
  href: string;
  /**
   * 아이콘 컴포넌트
   */
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: "홈",
    href: "/m",
    icon: Home,
  },
  {
    label: "주문하기",
    href: "/m/order",
    icon: ShoppingCart,
  },
  {
    label: "주문현황",
    href: "/m/order/status",
    icon: ClipboardList,
  },
  {
    label: "품질점검",
    href: "/m/quality-check",
    icon: CheckSquare,
  },
  {
    label: "공지사항",
    href: "/m/notices",
    icon: Bell,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <button
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-1 transition ${
                isActive
                  ? "text-[#967d5a]"
                  : "text-slate-500 active:bg-neutral-100"
              }`}
              aria-label={item.label}
            >
              <Icon
                className={`h-5 w-5 transition ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-t-full bg-[#967d5a]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
