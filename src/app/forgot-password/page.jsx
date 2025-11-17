"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    if (!email) {
      setError("이메일을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      // TODO: 비밀번호 재설정 API 구현
      // 현재는 임시 메시지만 표시
      setMessage("비밀번호 재설정 링크가 이메일로 전송되었습니다. (구현 예정)");
    } catch (error) {
      console.error("Password reset error:", error);
      setError("비밀번호 재설정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          로그인으로 돌아가기
        </Link>

        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl">
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">비밀번호 재설정</h2>
          <p className="mb-6 text-sm text-slate-500">
            등록된 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                이메일
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-600">
                {message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#967d5a] hover:bg-[#7a6548] text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "전송 중..." : "재설정 링크 전송"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

