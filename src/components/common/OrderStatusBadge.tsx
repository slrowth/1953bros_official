/**
 * 주문 상태 배지 컴포넌트
 * 주문 상태를 색상이 있는 배지로 표시
 */

import { ORDER_STATUS_MAP, getOrderStatusMeta } from "@/constants/orderStatus";

interface OrderStatusBadgeProps {
  /**
   * 주문 상태 코드
   */
  status: keyof typeof ORDER_STATUS_MAP | string;
  /**
   * 배지 크기
   * @default "default"
   */
  size?: "small" | "default" | "large";
  /**
   * 커스텀 클래스명
   */
  className?: string;
}

const sizeClasses = {
  small: "px-2 py-0.5 text-xs",
  default: "px-2.5 py-0.5 text-xs",
  large: "px-3 py-1 text-sm",
};

const toneColorMap = {
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800",
};

export default function OrderStatusBadge({ 
  status, 
  size = "default",
  className = "" 
}: OrderStatusBadgeProps) {
  const statusInfo = getOrderStatusMeta(status as keyof typeof ORDER_STATUS_MAP);
  const tone = statusInfo.tone || "default";
  const colorClass = toneColorMap[tone as keyof typeof toneColorMap] || toneColorMap.default;

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${colorClass} ${className}`}
    >
      {statusInfo.label}
    </span>
  );
}
