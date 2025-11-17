import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 공지사항별 미확인 매장 정보 조회 API
 * GET /api/notices/read-status
 * ADMIN만 접근 가능
 */
export async function GET(request) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // 모든 공지사항 조회
    const { data: notices, error: noticesError } = await supabase
      .from("notices")
      .select(`
        id,
        title,
        audience,
        published_at,
        is_pinned
      `)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    if (noticesError) {
      console.error("Fetch notices error:", noticesError);
      return NextResponse.json(
        { error: "공지사항 목록을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 각 공지사항별로 미확인 매장 정보 조회
    const noticesWithUnreadStores = await Promise.all(
      (notices || []).map(async (notice) => {
        // 공지사항의 audience에 맞는 사용자들 조회
        let targetUsersQuery = supabase
          .from("users")
          .select(`
            id,
            name,
            phone,
            store_id,
            store:stores(
              id,
              name,
              franchise_id,
              franchise:franchises(
                id,
                name
              )
            )
          `)
          .eq("status", "APPROVED"); // 승인된 사용자만

        // audience에 따라 필터링
        if (notice.audience === "FRANCHISEE") {
          targetUsersQuery = targetUsersQuery.in("role", ["OWNER", "ADMIN"]);
        } else if (notice.audience === "STAFF") {
          targetUsersQuery = targetUsersQuery.eq("role", "STAFF");
        } else if (notice.audience === "ALL") {
          targetUsersQuery = targetUsersQuery.in("role", ["OWNER", "STAFF", "ADMIN"]);
        }

        const { data: targetUsers, error: usersError } = await targetUsersQuery;

        if (usersError) {
          console.error("Fetch target users error:", usersError);
          return {
            ...notice,
            unreadStores: [],
            totalStores: 0,
            readStores: 0,
            unreadStoresCount: 0,
          };
        }

        // 이 공지사항을 읽은 사용자들 조회
        const { data: readUsers, error: readError } = await supabase
          .from("notice_reads")
          .select("user_id")
          .eq("notice_id", notice.id);

        if (readError) {
          console.error("Fetch read users error:", readError);
          return {
            ...notice,
            unreadStores: [],
            totalStores: 0,
            readStores: 0,
            unreadStoresCount: 0,
          };
        }

        const readUserIds = new Set((readUsers || []).map((r) => r.user_id));

        // 읽지 않은 사용자들 필터링
        const unreadUsers = (targetUsers || []).filter((u) => !readUserIds.has(u.id));

        // 매장별로 그룹화 (같은 매장의 여러 사용자가 있을 수 있음)
        const storeMap = new Map();
        unreadUsers.forEach((user) => {
          if (user.store && user.store.id) {
            const storeId = user.store.id;
            if (!storeMap.has(storeId)) {
              storeMap.set(storeId, {
                storeId: storeId,
                storeName: user.store.name,
                franchiseId: user.store.franchise?.id,
                franchiseName: user.store.franchise?.name,
                unreadUsersCount: 0,
                unreadUsers: [],
              });
            }
            const storeData = storeMap.get(storeId);
            storeData.unreadUsersCount++;
            // 미확인 사용자 정보 추가
            storeData.unreadUsers.push({
              id: user.id,
              name: user.name || "이름 없음",
              phone: user.phone || "전화번호 없음",
            });
          }
        });

        const unreadStores = Array.from(storeMap.values());

        // 전체 매장 수 계산 (중복 제거)
        const allStoreIds = new Set(
          (targetUsers || [])
            .filter((u) => u.store && u.store.id)
            .map((u) => u.store.id)
        );
        const totalStores = allStoreIds.size;

        // 읽은 매장 수 계산
        const readStoreIds = new Set(
          (targetUsers || [])
            .filter((u) => readUserIds.has(u.id) && u.store && u.store.id)
            .map((u) => u.store.id)
        );
        const readStores = readStoreIds.size;

        return {
          id: notice.id,
          title: notice.title,
          audience: notice.audience,
          publishedAt: notice.published_at,
          isPinned: notice.is_pinned,
          unreadStores: unreadStores,
          totalStores: totalStores,
          readStores: readStores,
          unreadStoresCount: unreadStores.length,
        };
      })
    );

    return NextResponse.json({ notices: noticesWithUnreadStores });
  } catch (error) {
    console.error("Read status API error:", error);
    return NextResponse.json(
      { error: "공지사항 확인여부를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

