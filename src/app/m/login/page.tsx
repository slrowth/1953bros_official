/**
 * 모바일 로그인 페이지
 * 모바일 환경에 최적화된 로그인 화면
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MobileLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // 로그인 상태 확인
  useEffect(() => {
    checkAuth();
  }, []);

  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("접근 권한이 없습니다.");
    } else if (errorParam === "rejected") {
      setError("회원가입이 거부되었습니다. 관리자에게 문의하세요.");
    }
  }, [searchParams]);

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
          // 이미 로그인된 경우 원래 가려던 페이지 또는 모바일 메인으로 리다이렉트
          if (userData.role === "OWNER" || userData.role === "STAFF") {
            const redirectPath = searchParams.get("redirect") || "/m";
            router.push(redirectPath);
          }
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

      // 원래 가려던 페이지 또는 모바일 메인으로 리다이렉트
      const redirectPath = searchParams.get("redirect") || "/m";
      
      if (data.user?.role === "OWNER" || data.user?.role === "STAFF") {
        router.push(redirectPath);
      } else if (data.user?.role === "ADMIN") {
        // 관리자는 데스크톱 관리자 페이지로
        router.push("/admin");
      } else {
        router.push(redirectPath);
      }
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-sm text-slate-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen flex-col bg-gradient-to-br from-neutral-50 via-white to-neutral-50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0)', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* 타이틀 */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              1953형제돼지국밥
            </h1>
            <p className="mt-2 text-xs text-slate-600">프랜차이즈 수발주 및 서비스 품질 관리 플랫폼</p>
          </div>

          {/* 로그인 폼 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">로그인</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  이메일
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
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
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 active:text-slate-600"
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
                variant="default"
                size="lg"
                className="w-full bg-[#967d5a] hover:bg-[#7a6548] text-white h-12 text-base font-semibold"
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
          <p className="mt-6 text-center text-xs text-slate-500">
            © 2025 1953형제돼지국밥 프랜차이즈 플랫폼. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
