/**
 * 주문 금액 계산 유틸
 * @param {object} order
 * @returns {number}
 */
export function calculateOrderGrossTotal(order) {
  // 이미 부가세가 포함된 단가를 기준으로 합계를 계산
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return Number(order?.totalAmount || 0);
  }

  const itemsTotal = order.items.reduce((sum, item) => {
    const safeUnitPrice = Number(item?.unitPrice) || 0;
    const safeQty = Number(item?.quantity) || 0;
    return sum + safeUnitPrice * safeQty;
  }, 0);

  if (itemsTotal <= 0) {
    return Number(order.totalAmount || 0);
  }

  return Math.round(itemsTotal);
}


