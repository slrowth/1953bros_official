-- 1953bros Storage 버킷 RLS 정책 설정
-- Supabase SQL Editor에서 실행하세요

-- 기존 정책이 있다면 삭제 (선택사항)
DROP POLICY IF EXISTS "1953bros Public Access" ON storage.objects;
DROP POLICY IF EXISTS "1953bros Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "1953bros Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "1953bros Admins can upload" ON storage.objects;

-- 모든 사용자가 파일 읽기 가능 (공개 버킷)
CREATE POLICY "1953bros Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = '1953bros');

-- 인증된 사용자만 파일 업로드 가능
CREATE POLICY "1953bros Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = '1953bros' 
  AND auth.role() = 'authenticated'
);

-- ADMIN 사용자는 모든 파일 업로드 가능
CREATE POLICY "1953bros Admins can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = '1953bros'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'ADMIN'
  )
);

-- 파일 소유자만 삭제 가능
CREATE POLICY "1953bros Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = '1953bros'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  )
);

