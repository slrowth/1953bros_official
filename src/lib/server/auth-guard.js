import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

/**
 * 인증 및 권한 체크를 수행하는 가드 함수
 * 레이아웃에서 사용하여 인증이 필요한 페이지를 보호합니다
 */

/**
 * 인증이 필요한 페이지를 보호합니다
 * @param {Object} options - 옵션 객체
 * @param {string[]} options.allowedRoles - 허용된 역할 배열 (예: ["OWNER", "STAFF"])
 * @param {string} options.redirectPath - 인증 실패 시 리다이렉트할 경로
 * @param {boolean} options.requireApproved - APPROVED 상태가 필요한지 여부
 * @returns {Promise<{user: Object, redirect: null}>} 사용자 정보 또는 리다이렉트
 */
export async function authGuard(options = {}) {
  const {
    allowedRoles = null,
    redirectPath = "/login",
    requireApproved = true,
  } = options;

  const { user, error } = await getCurrentUser();

  // 인증되지 않은 사용자
  if (error || !user) {
    redirect(`${redirectPath}?redirect=${encodeURIComponent(options.currentPath || "/")}`);
  }

  // PENDING 상태인 사용자는 대기 페이지로 리다이렉트
  if (requireApproved && user.status === "PENDING") {
    if (options.currentPath !== "/pending") {
      redirect("/pending");
    }
  }

  // REJECTED 상태인 사용자는 접근 불가
  if (user.status === "REJECTED") {
    redirect(`${redirectPath}?error=rejected`);
  }

  // 역할 체크
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(`${redirectPath}?error=unauthorized`);
  }

  return { user, redirect: null };
}

/**
 * Dashboard 라우트용 인증 가드
 * OWNER 또는 STAFF만 접근 가능
 */
/**
 * Dashboard 라우트용 인증 가드
 * OWNER 또는 STAFF만 접근 가능
 */
export async function dashboardAuthGuard() {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "/";
  
  return authGuard({
    allowedRoles: ["OWNER", "STAFF"],
    redirectPath: "/login",
    requireApproved: true,
    currentPath,
  });
}

/**
 * Admin 라우트용 인증 가드
 * ADMIN만 접근 가능
 */
export async function adminAuthGuard() {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "/";
  
  return authGuard({
    allowedRoles: ["ADMIN"],
    redirectPath: "/login",
    requireApproved: true,
    currentPath,
  });
}

/**
 * Mobile 라우트용 인증 가드
 * OWNER 또는 STAFF만 접근 가능
 */
export async function mobileAuthGuard() {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "/";
  
  return authGuard({
    allowedRoles: ["OWNER", "STAFF"],
    redirectPath: "/m/login",
    requireApproved: true,
    currentPath,
  });
}
