"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 주문 관리 메인 페이지 - 첫 번째 하위 페이지로 리다이렉트
export default function OrdersPage() {
  const router = useRouter();

  useEffect(() => {
    // 신규주문 현황으로 리다이렉트
    router.replace("/admin/orders/new");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
        <p className="mt-4 text-sm text-slate-500">주문 관리 페이지로 이동 중...</p>
      </div>
    </div>
  );
}

