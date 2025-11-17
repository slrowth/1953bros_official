-- 교육 자료 파일 저장을 위한 Storage 버킷 생성
-- Supabase 대시보드에서 Storage > New bucket으로 생성하거나, 아래 SQL을 실행

-- Storage 버킷 생성 (Supabase SQL Editor에서 실행)
-- 주의: Supabase에서는 Storage 버킷을 SQL로 직접 생성할 수 없으므로,
-- 대시보드에서 수동으로 생성해야 합니다.

-- 1. Supabase 대시보드에서 Storage로 이동
-- 2. "New bucket" 클릭
-- 3. 다음 설정으로 생성:
--    - Name: training-materials
--    - Public bucket: 체크 (공개 접근 허용)
--    - File size limit: 100MB (또는 원하는 크기)
--    - Allowed MIME types: (비워두면 모든 타입 허용)

-- Storage 정책 설정 (RLS)
-- 버킷 생성 후 아래 정책을 적용합니다:

-- 모든 사용자가 파일 읽기 가능 (공개 버킷)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-materials');

-- 인증된 사용자만 파일 업로드 가능
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'training-materials' 
  AND auth.role() = 'authenticated'
);

-- 파일 소유자만 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'training-materials'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

