/**
 * 품질점검 기록 조회 커스텀 훅
 * 품질점검 기록을 조회하고 관리하는 로직을 제공합니다.
 */

import { useState, useEffect, useCallback } from "react";

interface QualityRecordFilters {
  /**
   * 점검 날짜 필터 (YYYY-MM-DD 형식)
   */
  date?: string;
  /**
   * 매장 ID 필터
   */
  storeId?: string;
  /**
   * 체크리스트 ID 필터
   */
  checklistId?: string;
  /**
   * API 호출 활성화 여부
   * @default true
   */
  enabled?: boolean;
}

interface UseQualityRecordsReturn {
  /**
   * 점검 기록 목록
   */
  records: any[];
  /**
   * 로딩 상태
   */
  loading: boolean;
  /**
   * 에러 메시지
   */
  error: string;
  /**
   * 점검 기록 다시 불러오기
   */
  refetch: () => Promise<void>;
}

/**
 * 품질점검 기록 조회 훅
 * @param filters - 필터 옵션
 * @returns 점검 기록 목록, 로딩 상태, 에러, refetch 함수
 */
export function useQualityRecords(filters: QualityRecordFilters = {}): UseQualityRecordsReturn {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(filters.enabled !== false);
  const [error, setError] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.date) {
        params.append("date", filters.date);
      }
      if (filters.storeId) {
        params.append("storeId", filters.storeId);
      }
      if (filters.checklistId) {
        params.append("checklistId", filters.checklistId);
      }

      const response = await fetch(`/api/quality/records?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: "점검 기록을 불러오는데 실패했습니다." 
        }));
        throw new Error(errorData.error || "점검 기록을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setRecords(data.records || []);
    } catch (err: any) {
      console.error("Fetch records error:", err);
      setError(err.message || "점검 기록을 불러오는 중 오류가 발생했습니다.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters.date, filters.storeId, filters.checklistId]);

  useEffect(() => {
    // enabled가 명시적으로 false면 API 호출하지 않음
    if (filters.enabled === false) {
      setLoading(false);
      return;
    }

    // enabled가 true이거나 undefined일 때만 API 호출
    fetchRecords();
  }, [fetchRecords, filters.enabled]);

  return { records, loading, error, refetch: fetchRecords };
}
