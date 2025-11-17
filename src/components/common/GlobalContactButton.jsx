"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import SupportInquiryDrawer from "./SupportInquiryDrawer";

export default function GlobalContactButton() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isAuthPage = !pathname || pathname === "/" || pathname === "/register";
  if (isAuthPage) {
    return null;
  }

  const handleClick = useCallback(() => {
    if (typeof window !== "undefined" && pathname?.startsWith("/training")) {
      window.dispatchEvent(new CustomEvent("open-inquiry-panel"));
      return;
    }
    setIsDrawerOpen(true);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#967d5a] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#7a6548]"
      >
        <MessageSquare className="h-4 w-4" />
        문의하기
      </button>
      <SupportInquiryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        defaultPagePath={pathname}
      />
    </>
  );
}

