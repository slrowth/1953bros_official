"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserCheck,
  ShoppingBag,
  Package,
  FileText,
  Bell,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";
import UserProfileDropdown from "@/components/common/UserProfileDropdown";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationToaster from "@/components/notifications/NotificationToaster";

const adminNavItems = [
  {
    name: "대시보드",
    href: "/admin",
    icon: Home,
  },
  {
    name: "회원가입 승인",
    href: "/admin/approvals",
    icon: UserCheck,
  },
  {
    name: "주문 관리",
    href: "/admin/orders",
    icon: ShoppingBag,
    children: [
      { name: "신규주문 현황", href: "/admin/orders/new" },
      { name: "가맹점별 주문현황", href: "/admin/orders/by-store" },
      { name: "주문건별 현황", href: "/admin/orders/by-order" },
      { name: "제품별 현황", href: "/admin/orders/by-product" },
      { name: "발송대기 제품 현황", href: "/admin/orders/pending-shipment" },
    ],
  },
  {
    name: "제품 관리",
    href: "/admin/products",
    icon: Package,
    children: [
      { name: "제품 등록", href: "/admin/products/new" },
      { name: "제품 관리", href: "/admin/products/manage" },
    ],
  },
  {
    name: "공지사항",
    href: "/admin/notices/read-status",
    icon: Bell,
    children: [
      { name: "공지사항 관리", href: "/admin/notices/read-status" },
      { name: "공지사항 등록", href: "/admin/notices/new" },
    ],
  },
  {
    name: "교육 자료",
    href: "/admin/training/new",
    icon: BookOpen,
    children: [
      { name: "교육 자료 관리", href: "/admin/training/new" },
      { name: "교육 자료 등록", href: "/admin/training/new?view=create" },
      { name: "문의 관리", href: "/admin/training/inquiries" },
    ],
  },
  {
    name: "품질점검",
    href: "/admin/quality",
    icon: ClipboardCheck,
    children: [
      { name: "점검 기록 조회", href: "/admin/quality" },
      { name: "체크리스트 관리", href: "/admin/quality/checklists" },
      { name: "체크리스트 등록", href: "/admin/quality/checklists/new" },
    ],
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <NotificationProvider>
      <NotificationToaster />
      <div className="flex min-h-screen bg-neutral-50 text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-neutral-200 bg-white px-6 py-8 lg:flex overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Home className="h-5 w-5 text-[#967d5a]" />
          1953형제돼지국밥 프랜차이즈 플랫폼
        </Link>
        <p className="mt-6 text-xs font-medium uppercase text-slate-400">관리자 메뉴</p>
        <nav className="mt-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const hasActiveChild = hasChildren && item.children.some((child) => isActive(child.href));

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active || hasActiveChild
                      ? "bg-[#967d5a] text-white shadow-sm"
                      : "text-slate-600 hover:bg-[#967d5a]/10 hover:text-[#967d5a]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
                {hasChildren && (active || hasActiveChild) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`block rounded-lg px-4 py-2 text-xs font-medium transition ${
                          isActive(child.href)
                            ? "bg-[#967d5a]/20 text-[#967d5a]"
                            : "text-slate-500 hover:bg-neutral-100 hover:text-slate-700"
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-5 backdrop-blur-sm bg-white/95">
          <div className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">관리자 대시보드</span>
            <span className="mx-2 text-slate-300">•</span>
            시스템 관리
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <NotificationBell />
            <UserProfileDropdown />
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
    </NotificationProvider>
  );
}
