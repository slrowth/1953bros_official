"use client";

import { Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function PendingPage() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8 shadow-xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-yellow-100 p-4">
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <h1 className="mb-4 text-2xl font-semibold text-slate-900">회원가입 승인 대기 중</h1>

          <div className="mb-6 rounded-lg border border-yellow-200 bg-white p-4 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 mb-1">승인 대기 중입니다</p>
                <p className="text-sm text-slate-600">
                  관리자가 회원가입을 검토 중입니다. 승인 완료 후 서비스를 이용하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <p>• 승인 완료 시 자동으로 로그인됩니다</p>
            <p>• 승인 상태는 주기적으로 확인됩니다</p>
            <p>• 문의사항이 있으시면 관리자에게 연락해주세요</p>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-block rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

