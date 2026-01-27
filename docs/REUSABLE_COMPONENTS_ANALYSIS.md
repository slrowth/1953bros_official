# 주문/품질점검 관련 재사용 가능한 코드 분석

이 문서는 프로젝트 내 주문(Orders)과 품질점검(Quality) 관련 기존 코드에서 재사용할 수 있는 컴포넌트, 훅, API 호출 패턴을 정리한 것입니다.

---

## 📁 프로젝트 구조 개요

### 주문 관련 파일 구조
```
src/app/admin/orders/
├── page.jsx                    # 주문 목록 (대시보드)
├── new/page.jsx                # 신규 주문 관리
├── by-order/page.jsx           # 주문별 조회
├── by-product/page.jsx         # 상품별 조회
├── by-store/page.jsx           # 매장별 조회
└── pending-shipment/page.jsx   # 미발송 주문

src/app/api/orders/
├── route.js                    # 주문 생성/조회 API
└── [id]/route.js               # 주문 상세/수정 API
```

### 품질점검 관련 파일 구조
```
src/app/admin/quality/
├── page.jsx                    # 점검 기록 조회
├── checklists/
│   ├── page.jsx                # 체크리스트 목록
│   ├── new/page.jsx            # 체크리스트 등록
│   └── [id]/
│       ├── page.jsx            # 체크리스트 상세
│       └── edit/page.jsx       # 체크리스트 수정
└── records/
    └── [id]/page.jsx            # 점검 기록 상세

src/app/api/quality/
├── checklists/
│   ├── route.js                # 체크리스트 CRUD
│   └── [id]/route.js           # 체크리스트 상세/수정/삭제
└── records/
    ├── route.js                # 점검 기록 조회/생성
    ├── [id]/route.js           # 점검 기록 상세/수정
    └── my/route.js              # 내 점검 기록 조회
```

---

## 🔧 재사용 가능한 유틸리티 함수

### 1. 주문 금액 계산 유틸리티

**파일**: `src/utils/orderPrice.js`

```javascript
/**
 * 주문 총액 계산 (부가세 포함)
 * @param {object} order - 주문 객체
 * @returns {number} - 계산된 총액
 */
export function calculateOrderGrossTotal(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return Number(order?.totalAmount || 0);
  }

  const itemsTotal = order.items.reduce((sum, item) => {
    const safeUnitPrice = Number(item?.unitPrice) || 0;
    const safeQty = Number(item?.quantity) || 0;
    return sum + safeUnitPrice * safeQty;
  }, 0);

  if (itemsTotal <= 0) {
    return Number(order.totalAmount || 0);
  }

  return Math.round(itemsTotal);
}
```

**사용 예시**:
- 주문 목록에서 총액 표시
- 주문 상세 페이지에서 금액 계산
- 주문 요약 컴포넌트

**재사용 위치**:
- `src/app/admin/orders/by-order/page.jsx`
- `src/app/admin/orders/new/page.jsx`
- `src/app/(dashboard)/mypage/page.jsx`

---

### 2. 주문 상태 상수 및 헬퍼

**파일**: `src/constants/orderStatus.js`

```javascript
export const ORDER_STATUS_MAP = {
  NEW: { label: "입금대기", tone: "warning", description: "가맹점에서 주문을 제출했습니다." },
  PROCESSING: { label: "주문확인", tone: "info", description: "본사가 주문을 확인/처리 중입니다." },
  SHIPPED: { label: "배송중", tone: "info", description: "제품이 출고되어 배송 중입니다." },
  DELIVERED: { label: "배송완료", tone: "success", description: "가맹점에 제품이 전달되었습니다." },
  CANCELLED: { label: "취소됨", tone: "warning", description: "주문이 취소되었습니다." },
};

export function getOrderStatusMeta(status) {
  return ORDER_STATUS_MAP[status] || {
    label: status,
    tone: "info",
    description: "",
  };
}

export function getOrderStatusLabel(status) {
  return getOrderStatusMeta(status).label;
}
```

**사용 예시**:
- 주문 상태 표시 컴포넌트
- 상태별 필터링
- 상태별 색상/스타일 적용

**재사용 위치**:
- 모든 주문 관련 페이지
- 주문 목록 컴포넌트
- 주문 상세 컴포넌트

---

### 3. 통화 포맷터

**공통 패턴**: 여러 페이지에서 사용되는 통화 포맷터

```javascript
const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

// 사용 예시
currencyFormatter.format(10000); // "₩10,000"
```

**재사용 위치**:
- `src/app/admin/orders/by-order/page.jsx`
- `src/app/admin/orders/new/page.jsx`
- `src/app/(dashboard)/mypage/page.jsx`
- `src/app/(dashboard)/products/page.jsx`

**제안**: `src/utils/currency.js` 파일로 분리하여 재사용

---

## 🎣 재사용 가능한 커스텀 훅 패턴

### 1. 주문 목록 조회 훅 패턴

**패턴 분석**: 여러 페이지에서 반복되는 패턴

```javascript
// 재사용 가능한 훅으로 추출 가능
function useOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.storeId) params.append("storeId", filters.storeId);
      if (filters.franchiseId) params.append("franchiseId", filters.franchiseId);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "주문 목록을 불러오는데 실패했습니다.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(err.message || "주문 목록을 불러오는 중 오류가 발생했습니다.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
```

**제안 위치**: `src/lib/hooks/useOrders.js`

---

### 2. 주문 필터링 및 검색 훅 패턴

**패턴 분석**: 검색 및 필터링 로직이 반복됨

```javascript
// 재사용 가능한 훅
function useOrderFilters(orders) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderNumber = (order.orderCode || order.id || "").toLowerCase();
        return (
          orderNumber.includes(query) ||
          order.store?.name?.toLowerCase().includes(query) ||
          order.items?.some((item) => item.name?.toLowerCase().includes(query))
        );
      });
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.statusCode === statusFilter);
    }

    // 날짜 정렬
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.orderedAt);
      const dateB = new Date(b.orderedAt);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return sorted;
  }, [orders, searchQuery, statusFilter, sortOrder]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    filteredOrders,
  };
}
```

**제안 위치**: `src/lib/hooks/useOrderFilters.js`

---

### 3. 품질점검 기록 조회 훅 패턴

**패턴 분석**: 품질점검 기록 조회 로직

```javascript
// 재사용 가능한 훅
function useQualityRecords(filters = {}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.date) params.append("date", filters.date);
      if (filters.storeId) params.append("storeId", filters.storeId);
      if (filters.checklistId) params.append("checklistId", filters.checklistId);

      const response = await fetch(`/api/quality/records?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "점검 기록을 불러오는데 실패했습니다." }));
        throw new Error(errorData.error || "점검 기록을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error("Fetch records error:", err);
      setError(err.message || "점검 기록을 불러오는 중 오류가 발생했습니다.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, refetch: fetchRecords };
}
```

**제안 위치**: `src/lib/hooks/useQualityRecords.js`

---

### 4. 체크리스트 조회 훅 패턴

**패턴 분석**: 체크리스트 목록 조회 로직

```javascript
// 재사용 가능한 훅
function useChecklists() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChecklists = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/quality/checklists");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "체크리스트 목록을 불러오는데 실패했습니다.");
      }

      setChecklists(data.checklists || []);
    } catch (err) {
      console.error("Fetch checklists error:", err);
      setError(err.message || "체크리스트 목록을 불러오는 중 오류가 발생했습니다.");
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  return { checklists, loading, error, refetch: fetchChecklists };
}
```

**제안 위치**: `src/lib/hooks/useChecklists.js`

---

## 🧩 재사용 가능한 컴포넌트 패턴

### 1. 주문 상태 배지 컴포넌트

**패턴 분석**: 여러 페이지에서 주문 상태를 표시하는 배지

```javascript
// 제안: src/components/orders/OrderStatusBadge.jsx
import { ORDER_STATUS_MAP } from "@/constants/orderStatus";

export function OrderStatusBadge({ status }) {
  const statusInfo = ORDER_STATUS_MAP[status] || {
    label: status,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
      {statusInfo.label}
    </span>
  );
}
```

**재사용 위치**:
- 주문 목록 테이블
- 주문 상세 페이지
- 주문 카드 컴포넌트

---

### 2. 주문 아이템 목록 컴포넌트

**패턴 분석**: 주문 상세에서 아이템 목록을 표시하는 부분

```javascript
// 제안: src/components/orders/OrderItemsList.jsx
import { currencyFormatter } from "@/utils/currency";

export function OrderItemsList({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">주문 품목이 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between border-b border-neutral-200 py-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">SKU: {item.sku}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {currencyFormatter.format(item.unitPrice)} × {item.quantity}
            </p>
            <p className="text-xs text-slate-500">
              {currencyFormatter.format(item.unitPrice * item.quantity)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**재사용 위치**:
- 주문 상세 모달
- 주문 목록 확장 영역
- 주문 요약 컴포넌트

---

### 3. 주문 필터 컴포넌트

**패턴 분석**: 주문 목록 페이지에서 반복되는 필터 UI

```javascript
// 제안: src/components/orders/OrderFilters.jsx
export function OrderFilters({ 
  statusFilter, 
  onStatusChange, 
  searchQuery, 
  onSearchChange,
  sortOrder,
  onSortChange 
}) {
  return (
    <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="주문번호, 매장명, 상품명 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          />
        </div>

        {/* 상태 필터 */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
        >
          <option value="all">전체 상태</option>
          <option value="NEW">입금대기</option>
          <option value="PROCESSING">주문확인</option>
          <option value="SHIPPED">배송중</option>
          <option value="DELIVERED">배송완료</option>
          <option value="CANCELLED">취소됨</option>
        </select>

        {/* 정렬 */}
        <button
          onClick={() => onSortChange(sortOrder === "asc" ? "desc" : "asc")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === "asc" ? "과거순" : "최신순"}
        </button>
      </div>
    </div>
  );
}
```

**재사용 위치**:
- 모든 주문 목록 페이지
- 주문 대시보드

---

### 4. 품질점검 기록 카드 컴포넌트

**패턴 분석**: 점검 기록을 카드 형태로 표시

```javascript
// 제안: src/components/quality/QualityRecordCard.jsx
export function QualityRecordCard({ record, onView }) {
  const passedItems = record.items?.filter((item) => item.status === "PASS").length || 0;
  const totalItems = record.items?.length || 0;
  const passRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {record.checklist?.title || "체크리스트"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {record.store?.name || "매장 정보 없음"} · {record.date}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{passRate}%</p>
          <p className="text-xs text-slate-500">합격률</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          합격: <span className="font-medium text-green-600">{passedItems}</span>
        </span>
        <span className="text-slate-600">
          전체: <span className="font-medium text-slate-900">{totalItems}</span>
        </span>
      </div>

      <button
        onClick={() => onView(record.id)}
        className="w-full rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#967d5a]/90"
      >
        상세보기
      </button>
    </div>
  );
}
```

**재사용 위치**:
- 점검 기록 목록 페이지
- 점검 기록 대시보드

---

### 5. 로딩 스피너 컴포넌트

**패턴 분석**: 여러 페이지에서 반복되는 로딩 UI

```javascript
// 제안: src/components/common/LoadingSpinner.jsx
export function LoadingSpinner({ message = "로딩 중..." }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
        <p className="mt-4 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
```

**재사용 위치**:
- 모든 데이터 로딩이 필요한 페이지
- 비동기 작업 중 표시

---

### 6. 에러 메시지 컴포넌트

**패턴 분석**: 에러 표시 UI

```javascript
// 제안: src/components/common/ErrorMessage.jsx
export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-red-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-sm font-medium text-red-700 hover:text-red-900"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
```

**재사용 위치**:
- 모든 에러 처리가 필요한 페이지

---

## 🌐 재사용 가능한 API 호출 패턴

### 1. 주문 API 호출 함수

**제안**: `src/lib/api/orders.js`

```javascript
/**
 * 주문 목록 조회
 */
export async function fetchOrders(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.storeId) params.append("storeId", filters.storeId);
  if (filters.franchiseId) params.append("franchiseId", filters.franchiseId);
  if (filters.limit) params.append("limit", filters.limit);

  const response = await fetch(`/api/orders?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "주문 목록을 불러오는데 실패했습니다.");
  }

  return data.orders || [];
}

/**
 * 주문 상세 조회
 */
export async function fetchOrder(orderId) {
  const response = await fetch(`/api/orders/${orderId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "주문 정보를 불러오는데 실패했습니다.");
  }

  return data.order;
}

/**
 * 주문 수정
 */
export async function updateOrder(orderId, updateData) {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "주문 수정에 실패했습니다.");
  }

  return data.order;
}
```

---

### 2. 품질점검 API 호출 함수

**제안**: `src/lib/api/quality.js`

```javascript
/**
 * 점검 기록 조회
 */
export async function fetchQualityRecords(filters = {}) {
  const params = new URLSearchParams();
  if (filters.date) params.append("date", filters.date);
  if (filters.storeId) params.append("storeId", filters.storeId);
  if (filters.checklistId) params.append("checklistId", filters.checklistId);

  const response = await fetch(`/api/quality/records?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "점검 기록을 불러오는데 실패했습니다.");
  }

  return data.records || [];
}

/**
 * 점검 기록 생성
 */
export async function createQualityRecord(recordData) {
  const response = await fetch("/api/quality/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recordData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "점검 기록 생성에 실패했습니다.");
  }

  return data.record;
}

/**
 * 체크리스트 목록 조회
 */
export async function fetchChecklists() {
  const response = await fetch("/api/quality/checklists");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "체크리스트 목록을 불러오는데 실패했습니다.");
  }

  return data.checklists || [];
}
```

---

## 📊 서버 사이드 유틸리티 함수

### 1. 매장 정보 해석 함수

**파일**: `src/app/api/orders/route.js` (40-122줄)

```javascript
/**
 * 사용자 ID로부터 매장 정보를 해석하는 함수
 * 여러 API에서 재사용 가능
 */
export async function resolveStoreForUser(supabase, userId) {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("store_id, store_name")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    return {
      errorResponse: NextResponse.json(
        { error: "사용자 정보를 불러올 수 없습니다." },
        { status: 500 }
      ),
    };
  }

  // store_id 우선, 없으면 store_name으로 조회
  if (userData.store_id) {
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("id, franchise_id, name")
      .eq("id", userData.store_id)
      .eq("is_active", true)
      .single();

    if (storeError || !storeData) {
      return {
        errorResponse: NextResponse.json(
          { error: "매장 정보를 조회하는 중 오류가 발생했습니다." },
          { status: 500 }
        ),
      };
    }

    return { store: storeData };
  }

  // store_name으로 조회 (하위 호환성)
  if (userData.store_name) {
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("id, franchise_id, name")
      .eq("name", userData.store_name)
      .eq("is_active", true)
      .maybeSingle();

    if (storeError || !storeData) {
      return {
        errorResponse: NextResponse.json(
          { error: "매장 정보를 조회하는 중 오류가 발생했습니다." },
          { status: 500 }
        ),
      };
    }

    return { store: storeData };
  }

  return {
    errorResponse: NextResponse.json(
      { error: "해당 계정에 연결된 활성 매장이 없습니다. 관리자에게 문의하세요." },
      { status: 400 }
    ),
  };
}
```

**제안 위치**: `src/lib/server/store.js`로 분리

**재사용 위치**:
- 주문 생성 API
- 주문 조회 API
- 기타 매장 정보가 필요한 API

---

### 2. 날짜 포맷팅 함수

**파일**: `src/app/api/orders/route.js` (124-150줄)

```javascript
/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 */
function formatDate(date) {
  if (!date) {
    return "미정";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "미정";
  }
  return parsed.toISOString().slice(0, 10);
}

/**
 * 날짜를 YYYY-MM-DD HH:mm 형식으로 포맷팅
 */
function formatDateTime(date) {
  if (!date) {
    return "미정";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "미정";
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
```

**제안 위치**: `src/lib/utils/date.js`로 분리

---

### 3. 주문번호 생성 함수

**파일**: `src/app/api/orders/route.js` (13-38줄)

```javascript
const ORDER_CODE_LENGTH = 10;
const ORDER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateOrderCode() {
  const randomBytes = crypto.randomBytes(ORDER_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < ORDER_CODE_LENGTH; i += 1) {
    const index = randomBytes[i] % ORDER_CODE_CHARS.length;
    code += ORDER_CODE_CHARS[index];
  }
  return code;
}

async function generateUniqueOrderCode(supabase, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateOrderCode();
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("order_code", code)
      .limit(1)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }
  throw new Error("고유 주문번호 생성에 실패했습니다.");
}
```

**제안 위치**: `src/lib/server/orderCode.js`로 분리

---

## 📝 타입 정의

### 도메인 타입

**파일**: `src/types/domain.ts`

이미 잘 정의되어 있으며, 모든 주문/품질점검 관련 타입이 포함되어 있습니다:

- `Order`
- `OrderItem`
- `OrderStatus`
- `PaymentStatus`
- `QualityChecklist`
- `QualityItem`
- `QualityRecord`
- `QualityRecordItem`
- `QualityItemStatus`

**재사용 방법**:
- 컴포넌트 props 타입 정의
- API 응답 타입 검증
- 상태 관리 타입 정의

---

## 🎯 재사용 우선순위

### 높은 우선순위 (즉시 추출 권장)

1. **통화 포맷터** (`src/utils/currency.js`)
   - 여러 페이지에서 사용
   - 간단한 유틸리티 함수

2. **주문 상태 배지 컴포넌트** (`src/components/orders/OrderStatusBadge.jsx`)
   - UI 일관성 유지
   - 여러 페이지에서 반복 사용

3. **로딩 스피너 컴포넌트** (`src/components/common/LoadingSpinner.jsx`)
   - 모든 페이지에서 사용
   - UI 일관성 유지

4. **에러 메시지 컴포넌트** (`src/components/common/ErrorMessage.jsx`)
   - 에러 처리 표준화
   - 사용자 경험 개선

### 중간 우선순위

5. **주문 조회 훅** (`src/lib/hooks/useOrders.js`)
   - 데이터 페칭 로직 중복 제거
   - 상태 관리 표준화

6. **주문 필터 훅** (`src/lib/hooks/useOrderFilters.js`)
   - 필터링 로직 재사용
   - 검색 기능 표준화

7. **주문 API 함수** (`src/lib/api/orders.js`)
   - API 호출 로직 중앙화
   - 에러 처리 표준화

8. **매장 정보 해석 함수** (`src/lib/server/store.js`)
   - 서버 사이드 로직 재사용
   - 여러 API에서 사용

### 낮은 우선순위 (필요시 추출)

9. **주문 아이템 목록 컴포넌트**
10. **주문 필터 컴포넌트**
11. **품질점검 기록 카드 컴포넌트**
12. **날짜 포맷팅 함수**

---

## 📌 결론

프로젝트 내 주문/품질점검 관련 코드에서 다음과 같은 재사용 가능한 요소들을 확인했습니다:

- **유틸리티 함수**: 주문 금액 계산, 통화 포맷팅, 날짜 포맷팅
- **상수 및 헬퍼**: 주문 상태 맵, 상태 메타데이터 함수
- **커스텀 훅 패턴**: 데이터 페칭, 필터링, 검색 로직
- **컴포넌트 패턴**: 상태 배지, 아이템 목록, 필터 UI, 로딩/에러 UI
- **API 호출 패턴**: 주문/품질점검 API 래퍼 함수
- **서버 유틸리티**: 매장 정보 해석, 주문번호 생성

이러한 요소들을 적절히 추출하여 재사용하면 코드 중복을 줄이고 유지보수성을 크게 향상시킬 수 있습니다.
