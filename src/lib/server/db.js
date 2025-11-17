import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 일반 클라이언트를 사용한 데이터베이스 접근
 * RLS 정책이 적용됩니다
 */
export async function getDbClient() {
  return await createClient();
}

/**
 * 관리자 클라이언트를 사용한 데이터베이스 접근
 * RLS를 우회하여 관리 작업에 사용합니다
 * 주의: 서버 사이드에서만 사용하고 클라이언트에 노출하지 마세요
 */
export function getAdminDbClient() {
  return createAdminClient();
}

/**
 * 프랜차이즈별 데이터 접근을 위한 헬퍼
 * 사용자의 프랜차이즈 ID를 기반으로 필터링합니다
 */
export async function getFranchiseFilter(user) {
  if (!user || !user.franchiseId) {
    return null;
  }

  return {
    franchise_id: user.franchiseId,
  };
}

/**
 * 매장별 데이터 접근을 위한 헬퍼
 * 사용자의 매장 ID를 기반으로 필터링합니다
 */
export async function getStoreFilter(user) {
  if (!user || !user.storeId) {
    return null;
  }

  return {
    store_id: user.storeId,
  };
}

