"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, User, Briefcase, Phone } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [storeOptions, setStoreOptions] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  // stores 테이블에서 매장 목록 가져오기
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoadingStores(true);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from("stores")
          .select("id, name")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) {
          console.error("Stores fetch error:", error);
          // 에러 발생 시 빈 배열로 설정 (또는 기본값 사용 가능)
          setStoreOptions([]);
          return;
        }

        // { id, name } 형태로 저장하여 나중에 store_id를 찾을 수 있도록 함
        const stores = data?.map((store) => ({
          id: store.id,
          name: store.name,
        })) || [];
        setStoreOptions(stores);
      } catch (error) {
        console.error("Error fetching stores:", error);
        setStoreOptions([]);
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // 입력값 검증
    if (!email || !password || !confirmPassword) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          position,
          phone: phone || null,
          storeName: storeName || null,
          storeId: selectedStoreId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "회원가입 중 오류가 발생했습니다.");
        setIsLoading(false);
        return;
      }

      // 회원가입 성공
      setSuccess(data.message || "회원가입이 완료되었습니다.");
      
      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Signup error:", error);
      setError("회원가입 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

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

        {/* 회원가입 폼 */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">회원가입</h2>

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

            {/* 이름 (직책) 입력 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                이름 (직책)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="position"
                    type="text"
                    placeholder="직책"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* 전화번호 입력 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                전화번호
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 매장 선택 */}
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-sm font-medium text-slate-700">
                매장 선택 (선택사항)
              </Label>
              <select
                id="storeName"
                value={selectedStoreId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setSelectedStoreId(selectedId);
                  const selectedStore = storeOptions.find((s) => s.id === selectedId);
                  setStoreName(selectedStore ? selectedStore.name : "");
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={isLoading || isLoadingStores}
              >
                <option value="">
                  {isLoadingStores ? "매장 목록을 불러오는 중..." : "매장을 선택하세요"}
                </option>
                {storeOptions.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
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
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
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

            {/* 비밀번호 확인 입력 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                비밀번호 확인
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
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

            {/* 성공 메시지 */}
            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
                {success}
              </div>
            )}

            {/* 회원가입 버튼 */}
            <Button
              type="submit"
              className="w-full bg-[#967d5a] hover:bg-[#7a6548] text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "회원가입 중..." : "회원가입"}
            </Button>
          </form>

          {/* 추가 링크 */}
          <div className="mt-6 text-center text-sm">
            <Link
              href="/"
              className="text-[#967d5a] hover:underline font-medium"
            >
              이미 계정이 있으신가요? 로그인
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

