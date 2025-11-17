# Admin 계정 생성 가이드

## 방법 1: Supabase 대시보드에서 직접 수정 (가장 간단)

### 1단계: 일반 계정으로 회원가입
1. 회원가입 페이지에서 일반 계정 생성
2. 이메일과 비밀번호 입력

### 2단계: Supabase에서 role과 status 변경

**⚠️ 중요: Table Editor에서 직접 수정하면 대소문자 오류가 발생할 수 있습니다. SQL Editor 사용을 권장합니다.**

#### 방법 A: SQL Editor 사용 (권장)

1. Supabase 대시보드 접속
2. **SQL Editor**로 이동
3. 다음 SQL 쿼리 실행 (이메일 주소를 실제 이메일로 변경):

```sql
UPDATE users 
SET role = 'ADMIN', status = 'APPROVED' 
WHERE email = 'your-email@example.com';
```

4. **Run** 버튼 클릭하여 실행
5. 성공 메시지 확인

**주의**: 
- `role` 값은 정확히 `'ADMIN'` (대문자)이어야 합니다
- `status` 값은 정확히 `'APPROVED'` (대문자)이어야 합니다
- 작은따옴표(`'`)를 사용해야 합니다

#### 방법 B: Table Editor 사용 (주의 필요)

1. Supabase 대시보드 접속
2. **Table Editor** > **users** 테이블 선택
3. 생성된 사용자 레코드 찾기
4. 다음 필드 수정:
   - `role`: 드롭다운에서 `ADMIN` 선택 (정확히 대문자로)
   - `status`: 드롭다운에서 `APPROVED` 선택 (정확히 대문자로)
5. 저장

**주의**: 
- 드롭다운이 없고 직접 입력하는 경우, 정확히 `ADMIN`과 `APPROVED`를 입력해야 합니다
- 대소문자, 공백에 주의하세요
- 오류가 발생하면 SQL Editor 방법을 사용하세요

### 3단계: 로그인
1. 수정한 이메일/비밀번호로 로그인
2. `/admin` 경로로 접근 가능

---

## 방법 2: SQL로 직접 변경 (가장 확실한 방법)

Supabase **SQL Editor**에서 다음 쿼리 실행:

```sql
-- 기존 사용자를 ADMIN으로 변경
-- ⚠️ 이메일 주소를 실제 이메일로 변경하세요
UPDATE users 
SET role = 'ADMIN', status = 'APPROVED' 
WHERE email = 'your-admin-email@example.com';
```

**실행 후 확인:**
```sql
-- 변경이 제대로 되었는지 확인
SELECT id, email, role, status 
FROM users 
WHERE email = 'your-admin-email@example.com';
```

**예상 결과:**
- `role`: `ADMIN`
- `status`: `APPROVED`

**오류 발생 시:**
- 이메일 주소가 정확한지 확인
- `role`과 `status` 값이 정확히 `'ADMIN'`, `'APPROVED'` (대문자, 작은따옴표 포함)인지 확인

---

## 방법 3: 개발용 Admin 계정 생성 API 사용

개발 환경에서만 사용할 수 있는 API 엔드포인트가 제공됩니다.

### 사용 방법

1. 개발 서버 실행 (`npm run dev`)
2. 터미널에서 다음 명령 실행:

```bash
curl -X POST http://localhost:3000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password",
    "name": "관리자"
  }'
```

또는 브라우저 개발자 도구 콘솔에서:

```javascript
fetch('/api/admin/create-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'your-password',
    name: '관리자'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

**주의**: 이 API는 개발 환경에서만 작동하며, 프로덕션에서는 자동으로 차단됩니다.

---

## 방법 4: 기존 계정을 Admin으로 변경

이미 회원가입한 계정이 있다면:

### SQL Editor 사용 (권장)

1. Supabase 대시보드 > **SQL Editor**
2. 다음 쿼리 실행:

```sql
UPDATE users 
SET role = 'ADMIN', status = 'APPROVED' 
WHERE email = 'your-email@example.com';
```

3. 해당 계정으로 로그인

### Table Editor 사용 시 주의사항

Table Editor에서 직접 수정할 때는:
- `role` 필드에 정확히 `ADMIN` (대문자) 입력
- `status` 필드에 정확히 `APPROVED` (대문자) 입력
- 공백이나 소문자가 포함되지 않도록 주의
- 오류 발생 시 SQL Editor 방법 사용

---

## Admin 페이지 접근 방법

Admin 계정으로 로그인한 후:

- 공지사항 등록: `/admin/notices/new`
- 공지사항 수정: `/admin/notices/[id]/edit`
- 기타 Admin 전용 페이지: `/admin/*`

**참고**: 
- Admin 계정은 `/dashboard` 경로의 페이지도 접근 가능합니다 (middleware에서 OWNER/STAFF만 허용하지만, ADMIN도 접근 가능하도록 수정 가능)
- 일반 사용자(OWNER/STAFF)는 `/admin` 경로 접근 시 자동으로 로그인 페이지로 리다이렉트됩니다

