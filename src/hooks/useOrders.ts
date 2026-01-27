/**
 * 주문 목록 조회 커스텀 훅
 * 주문 목록을 조회하고 관리하는 로직을 제공합니다.
 */

import { useState, useEffect, useCallback } from "react";

interface OrderFilters {
  /**
   * 주문 상태 필터
   */
  status?: string;
  /**
   * 매장 ID 필터
   */
  storeId?: string;
  /**
   * 프랜차이즈 ID 필터
   */
  franchiseId?: string;
  /**
   * 조회 제한 개수
   * @default 50
   */
  limit?: number;
}

interface UseOrdersReturn {
  /**
   * 주문 목록
   */
  orders: any[];
  /**
   * 로딩 상태
   */
  loading: boolean;
  /**
   * 에러 메시지
   */
  error: string;
  /**
   * 주문 목록 다시 불러오기
   */
  refetch: () => Promise<void>;
}

/**
 * 주문 목록 조회 훅
 * @param filters - 필터 옵션
 * @returns 주문 목록, 로딩 상태, 에러, refetch 함수
 */
export function useOrders(filters: OrderFilters = {}): UseOrdersReturn {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.status) {
        params.append("status", filters.status);
      }
      if (filters.storeId) {
        params.append("storeId", filters.storeId);
      }
      if (filters.franchiseId) {
        params.append("franchiseId", filters.franchiseId);
      }
      params.append("limit", String(filters.limit || 50));

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "주문 목록을 불러오는데 실패했습니다.");
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      console.error("Fetch orders error:", err);
      setError(err.message || "주문 목록을 불러오는 중 오류가 발생했습니다.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.storeId, filters.franchiseId, filters.limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
