export const ORDER_STATUS_MAP = {
  NEW: { label: "입금대기", tone: "warning", description: "가맹점에서 주문을 제출했습니다." },
  PROCESSING: { label: "주문확인", tone: "info", description: "본사가 주문을 확인/처리 중입니다." },
  SHIPPED: { label: "배송중", tone: "info", description: "제품이 출고되어 배송 중입니다." },
  DELIVERED: { label: "배송완료", tone: "success", description: "가맹점에 제품이 전달되었습니다." },
  CANCELLED: { label: "취소됨", tone: "warning", description: "주문이 취소되었습니다." },
};

export function getOrderStatusMeta(status) {
  return ORDER_STATUS_MAP[status] || {
    label: status,
    tone: "info",
    description: "",
  };
}

export function getOrderStatusLabel(status) {
  return getOrderStatusMeta(status).label;
}

