/**
 * 위생점검 체크리스트 생성 스크립트
 * 실행 방법: node scripts/create-hygiene-checklist.js
 */

const checklistData = {
  title: "위생점검",
  description: "매장 내 위생 및 청결 상태를 점검하는 체크리스트입니다. 매일 정기적으로 점검하여 고객에게 안전하고 깨끗한 음식을 제공하세요.",
  items: [
    { label: "손 씻기 시설이 깨끗하고 비누, 종이타월이 비치되어 있는가?", order: 0 },
    { label: "조리대 및 작업대가 청결하고 소독되어 있는가?", order: 1 },
    { label: "냉장고 온도가 5℃ 이하로 유지되고 있는가?", order: 2 },
    { label: "냉동고 온도가 -18℃ 이하로 유지되고 있는가?", order: 3 },
    { label: "식자재가 올바르게 보관되고 유통기한이 확인되었는가?", order: 4 },
    { label: "조리기구 및 식기가 깨끗이 세척·소독되어 있는가?", order: 5 },
    { label: "화장실이 청결하고 비누, 휴지가 비치되어 있는가?", order: 6 },
    { label: "쓰레기통이 적절히 관리되고 뚜껑이 닫혀있는가?", order: 7 },
    { label: "바닥이 깨끗하고 미끄럼 방지 처리가 되어 있는가?", order: 8 },
    { label: "벽면 및 천장이 청결하고 곰팡이, 벌레가 없는가?", order: 9 },
    { label: "환기 시설이 정상 작동하고 공기가 쾌적한가?", order: 10 },
    { label: "직원이 위생복을 착용하고 위생적으로 관리되고 있는가?", order: 11 },
    { label: "직원이 손을 자주 씻고 위생 수칙을 준수하고 있는가?", order: 12 },
    { label: "식탁 및 의자가 깨끗이 정리되어 있는가?", order: 13 },
    { label: "매장 입구 및 주변 환경이 깨끗한가?", order: 14 },
    { label: "소독제 및 청소용품이 적절히 보관되어 있는가?", order: 15 },
    { label: "방역 작업이 정기적으로 수행되고 있는가?", order: 16 },
    { label: "음식물 쓰레기가 적절히 분리 배출되고 있는가?", order: 17 },
    { label: "조리 시 교차 오염 방지 조치가 되어 있는가?", order: 18 },
    { label: "위생점검 기록이 정확히 작성되고 있는가?", order: 19 },
  ],
};

async function createChecklist() {
  try {
    console.log("위생점검 체크리스트를 생성하는 중...");

    // 환경 변수에서 API URL 확인 (실제로는 인증이 필요하므로 관리자로 로그인한 상태에서 실행)
    const response = await fetch("http://localhost:3000/api/quality/checklists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checklistData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "체크리스트 생성에 실패했습니다.");
    }

    console.log("✅ 위생점검 체크리스트가 성공적으로 생성되었습니다!");
    console.log("체크리스트 ID:", data.checklist.id);
    console.log("제목:", data.checklist.title);
    console.log("항목 수:", checklistData.items.length);
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    console.log("\n대신 Supabase SQL Editor에서 다음 파일을 실행하세요:");
    console.log("supabase/create_hygiene_checklist.sql");
  }
}

// 스크립트가 직접 실행된 경우
if (require.main === module) {
  createChecklist();
}

module.exports = { checklistData };

