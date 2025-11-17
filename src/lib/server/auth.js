import { createClient } from "@/lib/supabase/server";

/**
 * 현재 인증된 사용자 정보를 가져옵니다
 * @returns {Promise<{user: User | null, error: Error | null}>}
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { user: null, error: authError };
  }

  // users 테이블에서 상세 정보 조회
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (error) {
    return { user: null, error };
  }

  return { user, error: null };
}

/**
 * 사용자의 역할을 확인합니다
 * @param {string[]} allowedRoles - 허용된 역할 배열
 * @returns {Promise<{authorized: boolean, user: User | null}>}
 */
export async function checkRole(allowedRoles) {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    return { authorized: false, user: null };
  }

  const authorized = allowedRoles.includes(user.role);
  return { authorized, user };
}

/**
 * 사용자의 상태를 확인합니다
 * @param {string[]} allowedStatuses - 허용된 상태 배열
 * @returns {Promise<{authorized: boolean, user: User | null}>}
 */
export async function checkStatus(allowedStatuses) {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    return { authorized: false, user: null };
  }

  const authorized = allowedStatuses.includes(user.status);
  return { authorized, user };
}

/**
 * 인증이 필요한 작업을 위한 헬퍼
 * 인증되지 않은 경우 null을 반환합니다
 * @returns {Promise<User | null>}
 */
export async function requireAuth() {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * 특정 역할이 필요한 작업을 위한 헬퍼
 * 권한이 없는 경우 null을 반환합니다
 * @param {string[]} allowedRoles - 허용된 역할 배열
 * @returns {Promise<User | null>}
 */
export async function requireRole(allowedRoles) {
  const { authorized, user } = await checkRole(allowedRoles);

  if (!authorized) {
    return null;
  }

  return user;
}

