-- 교육 자료 미디어 테이블 생성 (여러 미디어 지원)
-- 하나의 교육 자료에 여러 미디어(노션, 유튜브, PDF 등)를 추가할 수 있도록 함

CREATE TABLE IF NOT EXISTS training_material_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_material_id UUID NOT NULL REFERENCES training_materials(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('PDF', 'VIDEO', 'LINK', 'IMAGE', 'NOTION', 'YOUTUBE', 'DOCUMENT', 'FILE')),
  media_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_training_material_media_training_material_id ON training_material_media(training_material_id);
CREATE INDEX IF NOT EXISTS idx_training_material_media_display_order ON training_material_media(training_material_id, display_order);

-- 기존 데이터 마이그레이션 (기존 media_type과 media_url이 있는 경우)
-- 기존 데이터를 training_material_media 테이블로 이동
INSERT INTO training_material_media (training_material_id, media_type, media_url, display_order)
SELECT 
  id,
  media_type,
  media_url,
  0
FROM training_materials
WHERE media_type IS NOT NULL AND media_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM training_material_media 
    WHERE training_material_media.training_material_id = training_materials.id
  );

-- 기존 컬럼을 nullable로 변경 (하위 호환성 유지)
ALTER TABLE training_materials 
ALTER COLUMN media_type DROP NOT NULL;

ALTER TABLE training_materials 
ALTER COLUMN media_url DROP NOT NULL;

