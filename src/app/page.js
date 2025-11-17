"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // 로그인 상태 확인 (로그인 페이지에서는 자동 리다이렉트하지 않음)
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("role, status")
          .eq("id", authUser.id)
          .single();

        if (userData) {
          setUserRole(userData.role);
          // 로그인 페이지에서는 자동 리다이렉트하지 않고, 사용자가 로그인 상태임을 알려줌
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // 입력값 검증
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      // Supabase 로그인 API 호출
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 로그인 실패
        setError(data.error || "로그인에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // 사용자 상태 확인
      if (data.user?.status === "PENDING") {
        setError("회원가입 승인 대기 중입니다. 관리자 승인 후 이용 가능합니다.");
        setIsLoading(false);
        return;
      }

      if (data.user?.status === "REJECTED") {
        setError("회원가입이 거부되었습니다. 관리자에게 문의하세요.");
        setIsLoading(false);
        return;
      }

      // 로그인 성공 - role에 따라 리다이렉트
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/products");
      }
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  // 로그인 페이지에서는 자동 리다이렉트하지 않음
  // 사용자가 로그인 버튼을 눌러야만 리다이렉트됨

  // 로그인 페이지 표시
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* 타이틀 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            1953형제돼지국밥
            <br />
            프랜차이즈 플랫폼
          </h1>
          <p className="mt-2 text-sm text-slate-600">프랜차이즈 수발주 및 서비스 품질 관리 플랫폼</p>
        </div>

        {/* 로그인 폼 */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 입력 */}
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

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full bg-[#967d5a] hover:bg-[#7a6548] text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* 추가 링크 */}
          <div className="mt-6 space-y-3 text-center text-sm">
            <Link
              href="/register"
              className="block text-[#967d5a] hover:underline font-medium"
            >
              계정이 없으신가요? 회원가입
            </Link>
            <Link
              href="/forgot-password"
              className="block text-slate-500 hover:text-slate-700"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>

        {/* 푸터 */}
        <p className="mt-8 text-center text-xs text-slate-500">
          © 2025 1953형제돼지국밥 프랜차이즈 플랫폼. All rights reserved.
        </p>
      </div>
    </div>
  );
}
