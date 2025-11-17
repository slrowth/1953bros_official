-- Integration API 키 저장 테이블
CREATE TABLE IF NOT EXISTS integration_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL,
  label TEXT NOT NULL,
  zone TEXT,
  api_key TEXT NOT NULL,
  session_id TEXT,
  config JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_keys_service ON integration_keys(service);

ALTER TABLE integration_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자만 전체 조회" ON integration_keys
FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'ADMIN'));

CREATE POLICY "관리자만 삽입" ON integration_keys
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'ADMIN'));

CREATE POLICY "관리자만 수정" ON integration_keys
FOR UPDATE USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'ADMIN'));

CREATE POLICY "관리자만 삭제" ON integration_keys
FOR DELETE USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'ADMIN'));

