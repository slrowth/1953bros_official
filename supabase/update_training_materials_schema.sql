-- 교육 자료 테이블 스키마 업데이트
-- 노션, 유튜브 등 다양한 미디어 타입 지원

-- 기존 media_type 제약조건 제거 후 재생성
ALTER TABLE training_materials 
DROP CONSTRAINT IF EXISTS training_materials_media_type_check;

ALTER TABLE training_materials 
ADD CONSTRAINT training_materials_media_type_check 
CHECK (media_type IN ('PDF', 'VIDEO', 'LINK', 'IMAGE', 'NOTION', 'YOUTUBE', 'DOCUMENT', 'FILE'));

-- 문의하기 테이블 생성
CREATE TABLE IF NOT EXISTS training_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_material_id UUID NOT NULL REFERENCES training_materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ANSWERED', 'CLOSED')),
  answer TEXT,
  answered_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_training_inquiries_training_material_id ON training_inquiries(training_material_id);
CREATE INDEX IF NOT EXISTS idx_training_inquiries_user_id ON training_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_training_inquiries_status ON training_inquiries(status);

