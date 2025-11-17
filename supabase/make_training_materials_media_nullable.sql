-- training_materials 테이블의 media_type과 media_url을 nullable로 변경
-- training_material_media 테이블을 사용하므로 기존 컬럼은 nullable이어야 함

-- media_type을 nullable로 변경
ALTER TABLE training_materials 
ALTER COLUMN media_type DROP NOT NULL;

-- media_url을 nullable로 변경
ALTER TABLE training_materials 
ALTER COLUMN media_url DROP NOT NULL;

-- 변경 확인 (선택사항)
-- SELECT column_name, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'training_materials' 
-- AND column_name IN ('media_type', 'media_url');

