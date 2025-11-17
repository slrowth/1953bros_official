import { Suspense } from "react";
import TrainingPageContent from "./TrainingPageContent";

function TrainingPageFallback() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#967d5a]"></div>
          <p className="mt-4 text-sm text-slate-500">교육 자료를 준비하고 있습니다...</p>
        </div>
      </div>
    </div>
  );
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<TrainingPageFallback />}>
      <TrainingPageContent />
    </Suspense>
  );
}

