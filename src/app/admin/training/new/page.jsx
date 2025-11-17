import { Suspense } from "react";
import AdminTrainingPageContent from "./AdminTrainingPageContent";

function AdminTrainingPageFallback() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#967d5a]"></div>
          <p className="mt-4 text-sm text-slate-500">관리자 교육 페이지를 불러오는 중...</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminTrainingPage() {
  return (
    <Suspense fallback={<AdminTrainingPageFallback />}>
      <AdminTrainingPageContent />
    </Suspense>
  );
}

