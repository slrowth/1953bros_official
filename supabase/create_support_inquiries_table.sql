-- 전역 문의 (지원 티켓) 테이블 생성 스크립트
-- Supabase SQL Editor 또는 CLI로 실행해주세요.

CREATE TABLE IF NOT EXISTS support_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('ORDER', 'NOTICE', 'QUALITY', 'TRAINING', 'ACCOUNT', 'OTHER')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  page_path TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_inquiries_user_id ON support_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_support_inquiries_status ON support_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_support_inquiries_created_at ON support_inquiries(created_at DESC);

ALTER TABLE support_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 문의만 조회" ON support_inquiries
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 문의만 작성" ON support_inquiries
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 문의만 수정" ON support_inquiries
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

