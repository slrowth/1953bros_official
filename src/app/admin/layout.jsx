/**
 * Admin 레이아웃 (서버 컴포넌트)
 * 인증 및 권한 체크를 수행합니다
 */

import { adminAuthGuard } from "@/lib/server/auth-guard";
import AdminLayoutClient from "./layout-client";

export default async function AdminLayout({ children }) {
  // 인증 및 권한 체크
  await adminAuthGuard();

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
