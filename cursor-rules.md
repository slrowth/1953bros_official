## 프로젝트 디렉터리 구조 가이드

- `src/app/page.js` → 메인 인덱스 페이지
- `src/app/(auth)/login/page.jsx` → 로그인 페이지
- `src/app/(auth)/register/page.jsx` → 회원가입 페이지
- `src/app/(dashboard)/layout.jsx` → 가맹점주 전용 레이아웃
- `src/app/(dashboard)/products/page.jsx` → 상품 리스트(가맹점주)
- `src/app/(dashboard)/notices/page.jsx` → 공지사항 목록
- `src/app/(dashboard)/quality/page.jsx` → 품질 점검(달력 기반)
- `src/app/(dashboard)/training/page.jsx` → 교육 자료
- `src/app/(admin)/layout.jsx` → 어드민 전용 레이아웃
- `src/app/(admin)/dashboard/approvals/page.jsx` → 회원 가입 승인 대시보드
- `src/app/(admin)/dashboard/purchases/page.jsx` → 가맹점별 구매현황 대시보드
- `src/app/(admin)/dashboard/payments/page.jsx` → 결제 관리 대시보드
- `src/app/(admin)/dashboard/fulfillment/page.jsx` → 신규 주문·미발송 대시보드
- `src/app/(admin)/products/new/page.jsx` → 상품 등록
- `src/app/(admin)/products/manage/page.jsx` → 상품 관리
- `src/app/(admin)/training/new/page.jsx` → 교육 자료 등록
- `src/app/(admin)/notices/new/page.jsx` → 공지사항 등록
- `src/app/api/**` → App Router 기반 API 라우트 (REST/Route Handler)
- `src/components/ui/**` → shadcn UI 기반 공통 컴포넌트
- `src/components/common/**` → 페이지 공용 컴포넌트 (헤더, 사이드바 등)
- `src/lib/api/**` → 클라이언트/서버 공용 API 래퍼
- `src/lib/validators/**` → Zod 기반 폼/요청 검증 스키마
- `src/lib/hooks/**` → 커스텀 훅
- `src/lib/server/**` → 서버 헬퍼(데이터베이스, 인증 등)
- `src/types/**` → 전역 타입 정의
- `prisma/schema.prisma` (선택) → Prisma 사용 시 스키마 정의

## 인증 및 권한 가드

- `src/middleware.ts`에서 세션 검증과 역할별 라우트 가드를 수행한다.
  - `(dashboard)` 세그먼트는 `OWNER`/`STAFF`만 접근 허용.
  - `(admin)` 세그먼트는 `ADMIN`만 접근 허용.
  - `status === "PENDING"`인 사용자는 `/pending`으로 리다이렉트.
- 인증 스택은 Auth.js(NextAuth) 또는 Supabase Auth + RLS 중 하나를 선택.
  - Supabase 사용 시 Vercel 빌드 오류(정적 프리렌더 실패)를 피하려면 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 **빌드 타임**에도 반드시 제공한다.
  - 또는 민감 라우트는 `export const dynamic = "force-dynamic";`으로 설정해 빌드 타임 의존성을 제거할 수 있다.

## 도메인 데이터 모델 (초안)

```ts
// src/types/domain.ts
export type UserRole = "OWNER" | "ADMIN" | "STAFF";

export interface Franchise {
  id: string;
  code: string;
  name: string;
  contactName: string;
  contactPhone: string;
  address: string;
  region: string;
  createdAt: Date;
}

export interface Store {
  id: string;
  franchiseId: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  region: string;
  openedAt: Date | null;
  closedAt: Date | null;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  franchiseId: string | null;
  storeId: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  uom: string;
  weightGrams: number | null;
  taxRate: number;
  isShippable: boolean;
  leadTimeDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  franchiseId: string;
  storeId: string;
  status: "NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  totalAmount: number;
  currency: string;
  vatAmount: number;
  discountAmount: number;
  shippingMethod: string;
  shippingAddress: string;
  deliveryDate: Date | null;
  placedAt: Date;
  processedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  status: "PENDING" | "ALLOCATED" | "SHIPPED" | "CANCELLED";
  qtyAllocated: number;
  qtyShipped: number;
  qtyCancelled: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  audience: "ALL" | "FRANCHISEE" | "STAFF";
  publishedAt: Date;
  isPinned: boolean;
}

export interface NoticeRead {
  noticeId: string;
  userId: string;
  readAt: Date;
}

export interface QualityChecklist {
  id: string;
  title: string;
  description: string;
  items: QualityItem[];
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityItem {
  id: string;
  checklistId: string;
  label: string;
  order: number;
}

export interface QualityRecord {
  id: string;
  checklistId: string;
  checklistVersion: number;
  franchiseId: string;
  storeId: string | null;
  date: Date;
  completedById: string;
  items: QualityRecordItem[];
  notes: string | null;
  createdAt: Date;
}

export interface QualityRecordItem {
  itemId: string;
  status: "PASS" | "FAIL" | "N/A";
  comment: string | null;
}

export interface TrainingMaterial {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaType: "PDF" | "VIDEO" | "LINK" | "IMAGE";
  mediaUrl: string;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

export interface PaymentLog {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  processedAt: Date | null;
}
```

> 위 모델은 초안이며 구현 단계에서 Prisma, Drizzle 등 선택한 ORM에 맞춰 필드/타입을 정교화한다.

## 주문 내역 개선 사항

### 주문건 개념 및 구현

주문 제출 버튼을 누르면 현재 장바구니의 제품들이 하나의 "주문건"으로 저장되도록 구현했습니다. 주문건은 주문일·납품예정일·상태(입금대기/주문완료/배송완료)와 품목 목록을 포함합니다.

### 데이터 구조

- `src/data/orderHistory.js`에 기본 주문건(Mock) 데이터를 `initialOrderHistory`로 재구성해 품목별 수량·단가 정보를 포함하도록 수정했습니다.
- 주문건 데이터 구조:
  ```js
  {
    id: string,              // 주문건 ID (예: "ORD-20250108-001")
    orderedAt: string,       // 주문일 (YYYY-MM-DD)
    deliveryDate: string,    // 납품예정일
    status: string,          // 상태: "입금대기" | "주문완료" | "배송완료"
    statusTone: string,      // 상태 배지 색상: "warning" | "success" | "info"
    items: [                 // 주문 품목 목록
      {
        productId: string,
        name: string,
        quantity: number,
        unitPrice: number
      }
    ]
  }
  ```

### UI 컴포넌트

- 우측 주문 내역 패널을 `OrderHistoryPanel`로 교체했습니다.
  - 이번달/전체 주문 현황을 섹션별로 접고 펼칠 수 있습니다.
  - 상태별로 주문건이 그룹화됩니다 (입금대기, 주문완료, 배송완료).
  - 각 주문건을 클릭하면 포함된 제품 상세(수량·단가·총액)를 확인할 수 있습니다.
  - 상태별 요약 카운트가 상단에 표시됩니다.

### 주문 요약 기능

- 주문 요약 영역에는 총 수량을 추가했습니다.
- 주문 제출 시 장바구니가 자동으로 초기화됩니다.
- 주문 요약에서 각 제품의 수량을 조절하거나 삭제할 수 있습니다.

### 레이아웃 최적화

- 메인 컨테이너: `max-w-7xl`로 설정하여 충분한 공간 확보
- 오른쪽 사이드바: `max-w-md`로 설정
- 상태 배지 텍스트 크기: `text-[10px]`로 최적화하여 줄바꿈 방지

