/**
 * Dashboard 레이아웃 (서버 컴포넌트)
 * 인증 및 권한 체크를 수행합니다
 */

import { dashboardAuthGuard } from "@/lib/server/auth-guard";
import DashboardLayoutClient from "./layout-client";

export default async function DashboardLayout({ children }) {
  // 인증 및 권한 체크
  await dashboardAuthGuard();

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
