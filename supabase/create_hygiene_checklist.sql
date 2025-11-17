-- 위생점검 체크리스트 생성
-- 한국 외식업 매장에 적절한 위생점검 항목들

-- 1. 체크리스트 생성
INSERT INTO quality_checklists (id, title, description, version, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '위생점검',
  '매장 내 위생 및 청결 상태를 점검하는 체크리스트입니다. 매일 정기적으로 점검하여 고객에게 안전하고 깨끗한 음식을 제공하세요.',
  1,
  true,
  NOW(),
  NOW()
)
RETURNING id;

-- 체크리스트 ID를 변수로 저장하기 위해 함수 사용
DO $$
DECLARE
  checklist_id_val UUID;
BEGIN
  -- 체크리스트 생성
  INSERT INTO quality_checklists (title, description, version, is_active, created_at, updated_at)
  VALUES (
    '위생점검',
    '매장 내 위생 및 청결 상태를 점검하는 체크리스트입니다. 매일 정기적으로 점검하여 고객에게 안전하고 깨끗한 음식을 제공하세요.',
    1,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO checklist_id_val;

  -- 위생점검 항목들 추가
  INSERT INTO quality_items (checklist_id, label, "order", created_at) VALUES
    (checklist_id_val, '손 씻기 시설이 깨끗하고 비누, 종이타월이 비치되어 있는가?', 0, NOW()),
    (checklist_id_val, '조리대 및 작업대가 청결하고 소독되어 있는가?', 1, NOW()),
    (checklist_id_val, '냉장고 온도가 5℃ 이하로 유지되고 있는가?', 2, NOW()),
    (checklist_id_val, '냉동고 온도가 -18℃ 이하로 유지되고 있는가?', 3, NOW()),
    (checklist_id_val, '식자재가 올바르게 보관되고 유통기한이 확인되었는가?', 4, NOW()),
    (checklist_id_val, '조리기구 및 식기가 깨끗이 세척·소독되어 있는가?', 5, NOW()),
    (checklist_id_val, '화장실이 청결하고 비누, 휴지가 비치되어 있는가?', 6, NOW()),
    (checklist_id_val, '쓰레기통이 적절히 관리되고 뚜껑이 닫혀있는가?', 7, NOW()),
    (checklist_id_val, '바닥이 깨끗하고 미끄럼 방지 처리가 되어 있는가?', 8, NOW()),
    (checklist_id_val, '벽면 및 천장이 청결하고 곰팡이, 벌레가 없는가?', 9, NOW()),
    (checklist_id_val, '환기 시설이 정상 작동하고 공기가 쾌적한가?', 10, NOW()),
    (checklist_id_val, '직원이 위생복을 착용하고 위생적으로 관리되고 있는가?', 11, NOW()),
    (checklist_id_val, '직원이 손을 자주 씻고 위생 수칙을 준수하고 있는가?', 12, NOW()),
    (checklist_id_val, '식탁 및 의자가 깨끗이 정리되어 있는가?', 13, NOW()),
    (checklist_id_val, '매장 입구 및 주변 환경이 깨끗한가?', 14, NOW()),
    (checklist_id_val, '소독제 및 청소용품이 적절히 보관되어 있는가?', 15, NOW()),
    (checklist_id_val, '방역 작업이 정기적으로 수행되고 있는가?', 16, NOW()),
    (checklist_id_val, '음식물 쓰레기가 적절히 분리 배출되고 있는가?', 17, NOW()),
    (checklist_id_val, '조리 시 교차 오염 방지 조치가 되어 있는가?', 18, NOW()),
    (checklist_id_val, '위생점검 기록이 정확히 작성되고 있는가?', 19, NOW());

  RAISE NOTICE '위생점검 체크리스트가 생성되었습니다. ID: %', checklist_id_val;
END $$;

