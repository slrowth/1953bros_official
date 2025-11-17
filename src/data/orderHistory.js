export const initialOrderHistory = [
  {
    id: "ORD-20250108-001",
    orderedAt: "2025-01-08",
    deliveryDate: "2025-01-09",
    status: "입금대기",
    statusTone: "warning",
    items: [
      {
        productId: "pork-soup-mix",
        name: "돼지국밥 재료",
        quantity: 10,
        unitPrice: 15000,
      },
    ],
  },
  {
    id: "ORD-20250107-002",
    orderedAt: "2025-01-07",
    deliveryDate: "2025-01-08",
    status: "주문완료",
    statusTone: "success",
    items: [
      {
        productId: "broth-seasoning",
        name: "국물 양념",
        quantity: 5,
        unitPrice: 5000,
      },
      {
        productId: "rice-20kg",
        name: "밥",
        quantity: 4,
        unitPrice: 2000,
      },
    ],
  },
  {
    id: "ORD-20250105-003",
    orderedAt: "2025-01-05",
    deliveryDate: "2025-01-07",
    status: "배송완료",
    statusTone: "info",
    items: [
      {
        productId: "kimchi-5kg",
        name: "김치",
        quantity: 8,
        unitPrice: 8000,
      },
      {
        productId: "broth-seasoning",
        name: "국물 양념",
        quantity: 2,
        unitPrice: 5000,
      },
    ],
  },
];

