/**
 * Mobile 레이아웃 (서버 컴포넌트)
 * 서버 사이드에서 인증 체크를 수행합니다
 * /m/login은 별도 layout을 사용하므로 여기서는 체크하지 않습니다
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (authError || !authUser) {
      redirect("/m/login");
    }

    // 사용자 정보 확인
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", authUser.id)
      .single();

    // 사용자 정보가 없거나 권한이 없으면 로그인 페이지로
    if (userError || !userData || (userData.role !== "OWNER" && userData.role !== "STAFF")) {
      redirect("/m/login?error=unauthorized");
    }

    // 승인되지 않은 사용자는 로그인 페이지로
    if (userData.status !== "APPROVED") {
      redirect("/m/login?error=pending");
    }

    // 인증 성공 - children 렌더링
    return <>{children}</>;
  } catch (error) {
    // 에러 발생 시 로그인 페이지로 리다이렉트
    console.error("Mobile layout auth error:", error);
    redirect("/m/login");
  }
}
