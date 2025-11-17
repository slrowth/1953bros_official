import { Suspense } from "react";
import NewNoticePageContent from "./NewNoticePageContent";

function NewNoticePageFallback() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-[#967d5a]"></div>
          <p className="mt-4 text-sm text-slate-500">공지 페이지를 불러오는 중...</p>
        </div>
      </div>
    </div>
  );
}

export default function NewNoticePage() {
  return (
    <Suspense fallback={<NewNoticePageFallback />}>
      <NewNoticePageContent />
    </Suspense>
  );
}

