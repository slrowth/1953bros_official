# Vercel 배포 오류 해결 가이드

## 🔴 발생한 오류

```
Failed to load resource: the server responded with a status of 401 ()
api/auth/login:1 Failed to load resource: the server responded with a status of 401 ()
qrwkbsvwjsstvsnrpvjp.supabase.co/rest/v1/stores?...:1 Failed to load resource: net::ERR_NAME_NOT_RESOLVED
api/auth/signup:1 Failed to load resource: the server responded with a status of 400 ()
```

## 📋 오류 원인 분석

### 1. `ERR_NAME_NOT_RESOLVED` 오류
- **원인**: Supabase URL이 해석되지 않음
- **가능한 원인**:
  - Vercel에 환경 변수가 설정되지 않음
  - 환경 변수 값이 잘못됨
  - 환경 변수를 추가한 후 재배포를 하지 않음

### 2. `401` 인증 오류
- **원인**: Supabase 인증 실패
- **가능한 원인**:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 잘못되었거나 설정되지 않음
  - `NEXT_PUBLIC_SUPABASE_URL`이 잘못되었거나 설정되지 않음

### 3. `400` 회원가입 오류
- **원인**: 입력값 검증 실패 또는 Supabase 연결 문제
- **가능한 원인**:
  - 환경 변수 누락으로 인한 Supabase 연결 실패
  - 입력값 검증 실패

---

## ✅ 해결 방법

### Step 1: Vercel 환경 변수 확인

1. **Vercel 대시보드 접속**
   - [vercel.com](https://vercel.com)에 로그인
   - 프로젝트 선택

2. **환경 변수 설정 확인**
   - **Settings** 탭 클릭
   - 왼쪽 메뉴에서 **Environment Variables** 클릭
   - 다음 환경 변수들이 모두 설정되어 있는지 확인:

   ```
   ✅ NEXT_PUBLIC_SUPABASE_URL
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   ✅ SUPABASE_SERVICE_ROLE_KEY
   ```

### Step 2: 환경 변수 값 확인

각 환경 변수의 값이 올바른지 확인합니다:

#### `NEXT_PUBLIC_SUPABASE_URL`
- 형식: `https://xxxxx.supabase.co`
- 확인 방법:
  1. Supabase 대시보드 접속
  2. **Settings** > **API**로 이동
  3. **Project URL** 값을 복사
  4. `https://`로 시작하는지 확인

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 형식: 긴 문자열 (예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- 확인 방법:
  1. Supabase 대시보드 > **Settings** > **API**
  2. **anon public** 키를 복사
  3. 공백이나 줄바꿈이 없는지 확인

#### `SUPABASE_SERVICE_ROLE_KEY`
- 형식: 긴 문자열 (예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- 확인 방법:
  1. Supabase 대시보드 > **Settings** > **API**
  2. **service_role** 키를 복사
  3. ⚠️ **주의**: 이 키는 절대 클라이언트에 노출되면 안 됩니다!

### Step 3: 환경 변수 추가/수정

환경 변수가 없거나 잘못된 경우:

1. **환경 변수 추가**
   - **Add New** 버튼 클릭
   - **Key** 입력 (예: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value** 입력 (Supabase에서 복사한 값)
   - **Environment** 선택:
     - `NEXT_PUBLIC_SUPABASE_URL`: Production, Preview, Development 모두 선택
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Production, Preview, Development 모두 선택
     - `SUPABASE_SERVICE_ROLE_KEY`: Production, Preview만 선택 (Development는 선택 안 해도 됨)
   - **Add** 버튼 클릭

2. **환경 변수 수정**
   - 수정할 환경 변수 옆의 **...** 메뉴 클릭
   - **Edit** 선택
   - 올바른 값으로 수정
   - **Save** 클릭

### Step 4: 재배포 실행

환경 변수를 추가하거나 수정한 후에는 **반드시 재배포**해야 합니다:

1. **자동 재배포 (권장)**
   - Git 저장소에 새로운 커밋을 푸시하면 자동으로 재배포됩니다
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

2. **수동 재배포**
   - Vercel 대시보드에서 **Deployments** 탭으로 이동
   - 최신 배포 옆의 **...** 메뉴 클릭
   - **Redeploy** 선택
   - **Redeploy** 버튼 클릭

### Step 5: 배포 확인

재배포가 완료되면:

1. **배포 로그 확인**
   - **Deployments** 탭에서 배포 상태 확인
   - **Ready** 상태가 되면 성공

2. **사이트 테스트**
   - 배포된 URL로 접속
   - 브라우저 개발자 도구 (F12) 열기
   - **Console** 탭에서 오류 확인
   - **Network** 탭에서 API 요청 확인

3. **주요 기능 테스트**
   - 회원가입 페이지 접속
   - 로그인 시도
   - 매장 목록이 정상적으로 로드되는지 확인

---

## 🔍 추가 확인 사항

### Supabase 프로젝트 상태 확인

1. **Supabase 프로젝트 활성화 확인**
   - Supabase 대시보드에서 프로젝트가 **Active** 상태인지 확인
   - 프로젝트가 일시 중지되었거나 삭제되지 않았는지 확인

2. **API 키 유효성 확인**
   - Supabase 대시보드에서 **Settings** > **API**로 이동
   - 키가 최근에 재생성되지 않았는지 확인
   - 키가 재생성되었다면 Vercel의 환경 변수도 업데이트 필요

3. **RLS (Row Level Security) 정책 확인**
   - Supabase 대시보드에서 **Authentication** > **Policies** 확인
   - `stores` 테이블에 적절한 RLS 정책이 설정되어 있는지 확인

### 로컬 환경과의 비교

로컬에서는 정상 작동하지만 Vercel에서만 오류가 발생하는 경우:

1. **로컬 `.env.local` 파일 확인**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Vercel 환경 변수와 비교**
   - 로컬의 `.env.local` 값과 Vercel의 환경 변수 값이 동일한지 확인
   - 특히 공백이나 특수문자가 포함되지 않았는지 확인

---

## 🛠️ 문제 해결 체크리스트

배포 오류 해결을 위한 체크리스트:

- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_URL` 환경 변수가 설정되어 있음
- [ ] Vercel에 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경 변수가 설정되어 있음
- [ ] Vercel에 `SUPABASE_SERVICE_ROLE_KEY` 환경 변수가 설정되어 있음
- [ ] 모든 환경 변수 값이 올바름 (Supabase 대시보드에서 확인)
- [ ] 환경 변수 추가/수정 후 재배포를 실행함
- [ ] 재배포가 성공적으로 완료됨
- [ ] Supabase 프로젝트가 활성화되어 있음
- [ ] Supabase API 키가 유효함
- [ ] 브라우저 콘솔에 더 이상 오류가 없음
- [ ] 회원가입 페이지에서 매장 목록이 정상적으로 로드됨
- [ ] 로그인 기능이 정상 작동함

---

## 📞 추가 도움이 필요한 경우

위의 모든 단계를 확인했는데도 문제가 지속되면:

1. **Vercel 배포 로그 확인**
   - Vercel 대시보드 > **Deployments** > 배포 클릭 > **Build Logs** 확인
   - 빌드 중 환경 변수가 제대로 로드되었는지 확인

2. **Supabase 로그 확인**
   - Supabase 대시보드 > **Logs** 확인
   - API 요청이 정상적으로 들어오는지 확인

3. **브라우저 네트워크 탭 확인**
   - 개발자 도구 (F12) > **Network** 탭
   - 실패한 요청을 클릭하여 상세 정보 확인
   - **Response** 탭에서 에러 메시지 확인

---

**참고**: 환경 변수를 수정한 후에는 항상 재배포를 실행해야 변경사항이 적용됩니다!
