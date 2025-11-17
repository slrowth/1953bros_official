# Supabase 연동 작업 순서 가이드

이 문서는 Supabase 연동을 위한 전체 작업 순서를 단계별로 정리한 것입니다.

## ✅ 완료된 작업

다음 파일들이 이미 생성되었습니다:

### 1. 패키지 설치
- ✅ `@supabase/supabase-js` - Supabase 클라이언트 라이브러리
- ✅ `@supabase/ssr` - Next.js SSR 지원

### 2. 설정 파일
- ✅ `src/lib/supabase/client.js` - 클라이언트 사이드 Supabase 클라이언트
- ✅ `src/lib/supabase/server.js` - 서버 사이드 Supabase 클라이언트
- ✅ `src/lib/supabase/middleware.js` - 미들웨어용 Supabase 클라이언트

### 3. 타입 정의
- ✅ `src/types/domain.ts` - 도메인 데이터 모델 타입 정의

### 4. 인증 및 권한 관리
- ✅ `src/middleware.ts` - 인증 미들웨어 (라우트 가드)
- ✅ `src/lib/server/auth.js` - 인증 헬퍼 함수
- ✅ `src/lib/server/db.js` - 데이터베이스 접근 헬퍼

### 5. 데이터베이스 스키마
- ✅ `supabase/schema.sql` - 전체 데이터베이스 스키마 SQL

### 6. API 라우트 예시
- ✅ `src/app/api/auth/login/route.js` - 로그인 API 예시
- ✅ `src/app/api/products/route.js` - 상품 조회 API 예시

### 7. 문서
- ✅ `SUPABASE_SETUP.md` - 상세 설정 가이드
- ✅ `SUPABASE_연동_작업순서.md` - 이 문서

---

## 📝 다음 단계: 실제 적용하기

### Step 1: Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `1953-franchise-platform` (또는 원하는 이름)
   - Database Password: 강력한 비밀번호 설정 (⚠️ 반드시 저장)
   - Region: `Northeast Asia (Seoul)` 선택
4. 프로젝트 생성 완료 대기 (약 2분)

### Step 2: 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일 생성
2. Supabase 대시보드에서 **Settings** > **API**로 이동
3. 다음 정보를 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 절대 노출 금지)

4. `.env.local` 파일에 추가:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: 데이터베이스 스키마 적용

1. Supabase 대시보드에서 **SQL Editor**로 이동
2. **New Query** 클릭
3. `supabase/schema.sql` 파일의 전체 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭하여 실행
5. 성공 메시지 확인

### Step 4: 테이블 확인

1. Supabase 대시보드에서 **Table Editor**로 이동
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ franchises
   - ✅ stores
   - ✅ users
   - ✅ product_categories
   - ✅ products
   - ✅ orders
   - ✅ order_items
   - ✅ notices
   - ✅ notice_reads
   - ✅ quality_checklists
   - ✅ quality_items
   - ✅ quality_records
   - ✅ quality_record_items
   - ✅ training_materials
   - ✅ payment_logs

### Step 5: 인증 설정

1. Supabase 대시보드에서 **Authentication** > **Providers**로 이동
2. **Email** 프로바이더 활성화
3. 필요에 따라 설정 조정:
   - Enable email confirmations: 개발 중에는 비활성화 권장
   - Secure email change: 필요시 활성화

### Step 6: 사용자 등록 트리거 설정 (선택사항)

`auth.users`에 사용자가 생성될 때 자동으로 `public.users` 테이블에 레코드를 생성하려면:

1. **SQL Editor**에서 다음 쿼리 실행:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    '',
    'STAFF',
    'PENDING'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 7: 개발 서버 실행 및 테스트

1. 터미널에서 개발 서버 실행:
```bash
npm run dev
```

2. 브라우저에서 `http://localhost:3000` 접속

3. 브라우저 개발자 도구 콘솔에서 테스트:
```javascript
// 클라이언트 사이드 연결 테스트
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.from('products').select('*').limit(1);
console.log('Products:', data, 'Error:', error);
```

### Step 8: RLS 정책 확인 및 수정

1. Supabase 대시보드에서 **Authentication** > **Policies**로 이동
2. 각 테이블별로 정책 확인
3. 필요에 따라 추가 정책 설정

**기본 정책:**
- 사용자는 자신의 정보를 볼 수 있음
- OWNER/STAFF는 자신의 프랜차이즈 정보를 볼 수 있음
- 모든 사용자는 활성화된 상품을 볼 수 있음
- ADMIN은 모든 상품을 볼 수 있음
- OWNER/STAFF는 자신의 주문을 볼 수 있음

---

## 🔧 사용 방법

### 클라이언트 사이드에서 사용

```javascript
// 컴포넌트에서
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);
```

### 서버 사이드에서 사용

```javascript
// Server Component, Server Action, Route Handler에서
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/server/auth';

// 인증이 필요한 경우
const user = await requireAuth();
if (!user) {
  return { error: '인증이 필요합니다.' };
}

const supabase = await createClient();
const { data, error } = await supabase
  .from('products')
  .select('*');
```

### 인증 확인

```javascript
import { requireRole } from '@/lib/server/auth';

// 특정 역할이 필요한 경우
const user = await requireRole(['ADMIN', 'OWNER']);
if (!user) {
  return { error: '권한이 없습니다.' };
}
```

### 관리자 클라이언트 사용 (RLS 우회)

```javascript
import { createAdminClient } from '@/lib/supabase/server';

// ⚠️ 주의: 서버 사이드에서만 사용
const adminSupabase = createAdminClient();
const { data, error } = await adminSupabase
  .from('users')
  .select('*');
```

---

## 🚨 주의사항

1. **환경 변수 보안**
   - `.env.local` 파일은 절대 Git에 커밋하지 마세요
   - `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하지 마세요

2. **RLS 정책**
   - 프로덕션 환경에서는 반드시 RLS를 활성화하세요
   - 개발 중에도 가능한 한 RLS를 활성화하여 테스트하세요

3. **빌드 타임 오류**
   - Vercel 등에서 빌드 시 환경 변수를 설정해야 합니다
   - 또는 민감한 라우트에 `export const dynamic = "force-dynamic";` 추가

4. **인증 플로우**
   - Supabase Auth를 사용하는 경우 `auth.users` 테이블을 사용합니다
   - `public.users` 테이블은 추가 정보(role, status 등)를 저장합니다

---

## 📚 추가 리소스

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - 상세 설정 가이드
- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## ❓ 문제 해결

### 환경 변수가 인식되지 않는 경우
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버를 재시작
- 변수명이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)

### RLS 정책 오류
- Supabase 대시보드에서 정책 확인
- 개발 중에는 임시로 RLS 비활성화 가능 (프로덕션에서는 반드시 활성화)

### 인증 오류
- 브라우저 개발자 도구에서 쿠키 확인
- `middleware.ts`의 경로 매칭 확인
- Supabase 대시보드에서 사용자 생성 확인

---

## ✅ 체크리스트

연동이 완료되었는지 확인하세요:

- [ ] Supabase 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료 (`.env.local`)
- [ ] 데이터베이스 스키마 적용 완료
- [ ] 모든 테이블 생성 확인
- [ ] 인증 설정 완료
- [ ] 개발 서버 실행 성공
- [ ] 클라이언트 연결 테스트 성공
- [ ] 서버 사이드 연결 테스트 성공
- [ ] RLS 정책 확인 완료

---

작업이 완료되면 이 체크리스트를 모두 확인하세요! 🎉

