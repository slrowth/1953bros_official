"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserCheck, ShoppingBag, Package, Bell, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    newOrders: 0,
    totalProducts: 0,
    activeNotices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState(["all"]);

  useEffect(() => {
    fetchDashboardStats();
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/stores?isActive=true");
      const data = await response.json();
      if (response.ok) {
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error("Fetch stores error:", err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const supabase = createClient();

      // 회원가입 대기자 수
      const { count: pendingCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");

      // 신규 주문 수 (NEW 상태)
      const { count: newOrdersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "NEW");

      // 활성 제품 수
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // 활성 공지사항 수
      const { count: noticesCount } = await supabase
        .from("notices")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        pendingApprovals: pendingCount || 0,
        newOrders: newOrdersCount || 0,
        totalProducts: productsCount || 0,
        activeNotices: noticesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "회원가입 대기",
      value: stats.pendingApprovals,
      icon: UserCheck,
      href: "/admin/approvals",
      color: "bg-blue-50 text-blue-600",
      iconColor: "text-blue-600",
    },
    {
      title: "신규 주문",
      value: stats.newOrders,
      icon: ShoppingBag,
      href: "/admin/orders/new",
      color: "bg-emerald-50 text-emerald-600",
      iconColor: "text-emerald-600",
    },
    {
      title: "활성 제품",
      value: stats.totalProducts,
      icon: Package,
      href: "/admin/products/manage",
      color: "bg-amber-50 text-amber-600",
      iconColor: "text-amber-600",
    },
    {
      title: "활성 공지사항",
      value: stats.activeNotices,
      icon: Bell,
      href: "/admin/notices/read-status",
      color: "bg-purple-50 text-purple-600",
      iconColor: "text-purple-600",
    },
  ];

  const quickActions = [
    {
      title: "제품 등록",
      description: "새로운 제품을 등록합니다",
      href: "/admin/products/new",
      icon: Package,
    },
    {
      title: "공지사항 등록",
      description: "새로운 공지사항을 작성합니다",
      href: "/admin/notices/new",
      icon: Bell,
    },
    {
      title: "교육 자료 등록",
      description: "새로운 교육 자료를 등록합니다",
      href: "/admin/training/new",
      icon: BookOpen,
    },
  ];

  // 더미 데이터 생성 함수 (매장별로 다른 데이터 생성, seed 기반으로 고정)
  const generateStoreData = (storeId, baseMultiplier = 1) => {
    const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    // storeId를 seed로 사용하여 일관된 랜덤 값 생성
    const seed = storeId ? storeId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const variations = [0.95, 1.05, 0.9, 1.1, 0.85, 1.15, 0.92, 1.08, 0.88, 1.12, 0.93, 1.07];
    
    return months.map((month, index) => {
      const variation = variations[(seed + index) % variations.length];
      const baseRevenue = (12500000 + index * 800000) * baseMultiplier * variation;
      const basePurchase = baseRevenue * 0.68 * variation;
      return {
        month,
        매장매출: Math.round(baseRevenue),
        매장제품구매금액: Math.round(basePurchase),
      };
    });
  };

  // 매장 선택 핸들러
  const handleStoreToggle = (storeId) => {
    if (storeId === "all") {
      // "전체" 선택 시
      if (selectedStoreIds.includes("all")) {
        setSelectedStoreIds([]);
      } else {
        setSelectedStoreIds(["all"]);
      }
    } else {
      // 개별 매장 선택 시
      setSelectedStoreIds((prev) => {
        const newIds = prev.filter((id) => id !== "all"); // "all" 제거
        if (newIds.includes(storeId)) {
          // 이미 선택된 경우 제거
          return newIds.length === 1 ? ["all"] : newIds.filter((id) => id !== storeId);
        } else {
          // 선택되지 않은 경우 추가
          return [...newIds, storeId];
        }
      });
    }
  };

  const generateProductData = (storeId, baseMultiplier = 1) => {
    const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    const products = ["돼지국밥", "수육", "냉면", "김치찌개"];
    const baseValues = {
      "돼지국밥": [3200000, 3500000, 3800000, 3600000, 4200000, 4400000, 4600000, 4900000, 4700000, 5200000, 5000000, 5700000],
      "수육": [2100000, 2300000, 2500000, 2400000, 2800000, 2900000, 3100000, 3300000, 3200000, 3500000, 3400000, 3800000],
      "냉면": [1800000, 1950000, 2100000, 2000000, 2300000, 2400000, 2500000, 2700000, 2600000, 2900000, 2800000, 3200000],
      "김치찌개": [1400000, 1450000, 1700000, 1800000, 1900000, 2000000, 2100000, 2300000, 2200000, 2300000, 2200000, 2500000],
    };
    
    const seed = storeId ? storeId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const variations = [0.9, 1.0, 0.95, 1.05, 0.88, 1.12, 0.92, 1.08, 0.93, 1.07, 0.91, 1.09];

    return months.map((month, index) => {
      const data = { month };
      products.forEach((product, pIndex) => {
        const variation = variations[(seed + index + pIndex) % variations.length];
        data[product] = Math.round(baseValues[product][index] * baseMultiplier * variation);
      });
      return data;
    });
  };

  // 선택된 매장에 따른 데이터 계산 (useMemo로 최적화)
  const monthlyStoreData = useMemo(() => {
    const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    let data;

    if (selectedStoreIds.includes("all") || selectedStoreIds.length === 0) {
      // 전체 매장 합계 (기본 데이터)
      data = [
        { month: "1월", 매장매출: 12500000, 매장제품구매금액: 8500000 },
        { month: "2월", 매장매출: 13800000, 매장제품구매금액: 9200000 },
        { month: "3월", 매장매출: 15200000, 매장제품구매금액: 10100000 },
        { month: "4월", 매장매출: 14500000, 매장제품구매금액: 9800000 },
        { month: "5월", 매장매출: 16800000, 매장제품구매금액: 11200000 },
        { month: "6월", 매장매출: 17500000, 매장제품구매금액: 11800000 },
        { month: "7월", 매장매출: 18200000, 매장제품구매금액: 12300000 },
        { month: "8월", 매장매출: 19500000, 매장제품구매금액: 13200000 },
        { month: "9월", 매장매출: 18800000, 매장제품구매금액: 12700000 },
        { month: "10월", 매장매출: 20500000, 매장제품구매금액: 13900000 },
        { month: "11월", 매장매출: 19800000, 매장제품구매금액: 13400000 },
        { month: "12월", 매장매출: 22500000, 매장제품구매금액: 15200000 },
      ];
    } else {
      // 선택된 매장들의 데이터 합산
      const selectedStores = stores.filter((store) => selectedStoreIds.includes(store.id));
      
      // 각 매장의 데이터 생성
      const storesData = selectedStores.map((store) => {
        const storeIndex = stores.findIndex((s) => s.id === store.id);
        const multiplier = 0.3 + (storeIndex % 3) * 0.2; // 0.3, 0.5, 0.7 배
        return generateStoreData(store.id, multiplier);
      });

      // 월별로 합산
      data = months.map((month) => {
        const monthData = storesData.map((storeData) => 
          storeData.find((item) => item.month === month)
        );
        
        return {
          month,
          매장매출: monthData.reduce((sum, item) => sum + (item?.매장매출 || 0), 0),
          매장제품구매금액: monthData.reduce((sum, item) => sum + (item?.매장제품구매금액 || 0), 0),
        };
      });
    }
    
    // 비율 계산 추가 (매출 대비 제품구매 비율)
    return data.map((item) => ({
      ...item,
      비율: item.매장매출 > 0 
        ? Number(((item.매장제품구매금액 / item.매장매출) * 100).toFixed(1))
        : 0,
    }));
  }, [selectedStoreIds, stores]);

  const monthlyProductData = useMemo(() => {
    const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    
    if (selectedStoreIds.includes("all") || selectedStoreIds.length === 0) {
      // 전체 매장 합계
      return [
        { month: "1월", "돼지국밥": 3200000, "수육": 2100000, "냉면": 1800000, "김치찌개": 1400000 },
        { month: "2월", "돼지국밥": 3500000, "수육": 2300000, "냉면": 1950000, "김치찌개": 1450000 },
        { month: "3월", "돼지국밥": 3800000, "수육": 2500000, "냉면": 2100000, "김치찌개": 1700000 },
        { month: "4월", "돼지국밥": 3600000, "수육": 2400000, "냉면": 2000000, "김치찌개": 1800000 },
        { month: "5월", "돼지국밥": 4200000, "수육": 2800000, "냉면": 2300000, "김치찌개": 1900000 },
        { month: "6월", "돼지국밥": 4400000, "수육": 2900000, "냉면": 2400000, "김치찌개": 2000000 },
        { month: "7월", "돼지국밥": 4600000, "수육": 3100000, "냉면": 2500000, "김치찌개": 2100000 },
        { month: "8월", "돼지국밥": 4900000, "수육": 3300000, "냉면": 2700000, "김치찌개": 2300000 },
        { month: "9월", "돼지국밥": 4700000, "수육": 3200000, "냉면": 2600000, "김치찌개": 2200000 },
        { month: "10월", "돼지국밥": 5200000, "수육": 3500000, "냉면": 2900000, "김치찌개": 2300000 },
        { month: "11월", "돼지국밥": 5000000, "수육": 3400000, "냉면": 2800000, "김치찌개": 2200000 },
        { month: "12월", "돼지국밥": 5700000, "수육": 3800000, "냉면": 3200000, "김치찌개": 2500000 },
      ];
    } else {
      // 선택된 매장들의 데이터 합산
      const selectedStores = stores.filter((store) => selectedStoreIds.includes(store.id));
      
      // 각 매장의 데이터 생성
      const storesData = selectedStores.map((store) => {
        const storeIndex = stores.findIndex((s) => s.id === store.id);
        const multiplier = 0.3 + (storeIndex % 3) * 0.2;
        return generateProductData(store.id, multiplier);
      });

      // 월별로 합산
      return months.map((month) => {
        const monthData = storesData.map((storeData) => 
          storeData.find((item) => item.month === month)
        );
        
        const products = ["돼지국밥", "수육", "냉면", "김치찌개"];
        const result = { month };
        
        products.forEach((product) => {
          result[product] = monthData.reduce((sum, item) => sum + (item?.[product] || 0), 0);
        });
        
        return result;
      });
    }
  }, [selectedStoreIds, stores]);

  // 금액 포맷팅 함수
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">관리자 대시보드</h1>
        <p className="mt-1 text-sm text-slate-500">
          시스템 전체 현황을 한눈에 확인하고 관리하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#967d5a]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <div className={`rounded-xl ${card.color} p-3`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 통계 차트 섹션 */}
      <div className="mb-8 space-y-6">
        {/* 월별 매장매출 및 매장제품구매금액 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              월별 매장매출 및 제품구매금액
              {!selectedStoreIds.includes("all") && selectedStoreIds.length > 0 && (
                <span className="ml-2 text-base font-normal text-slate-500">
                  ({selectedStoreIds.length}개 매장 합산)
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-500">월별 매장매출과 제품구매금액 추이를 확인하세요</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyStoreData} margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis
                    yAxisId="left"
                    stroke="#64748b"
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    label={{ value: "금액 (원)", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: "비율 (%)", angle: 90, position: "insideRight", style: { textAnchor: "middle" } }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
                            <p className="font-semibold text-slate-900 mb-2">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.name === "비율" || entry.name === "매출/구매비율"
                                  ? `${entry.value}%` 
                                  : formatCurrency(entry.value)}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="매장매출"
                    stroke="#967d5a"
                    strokeWidth={3}
                    dot={{ fill: "#967d5a", r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="매장제품구매금액"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="비율"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="매출/구매비율"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 rounded-lg p-4 h-full">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">매장별 구매량 현황</h3>
                <div className="space-y-3 max-h-[360px] overflow-y-auto">
                  {(() => {
                    const currentMonth = new Date().getMonth() + 1; // 1-12

                    // 선택된 매장들에 대한 데이터 계산
                    const displayStores = selectedStoreIds.includes("all") || selectedStoreIds.length === 0
                      ? stores
                      : stores.filter((store) => selectedStoreIds.includes(store.id));

                    return displayStores.map((store) => {
                      const storeIndex = stores.findIndex((s) => s.id === store.id);
                      const multiplier = 0.3 + (storeIndex % 3) * 0.2;
                      const storeData = generateStoreData(store.id, multiplier);
                      const thisMonthData = storeData.find((item) => item.month === `${currentMonth}월`) || storeData[storeData.length - 1];
                      const yearToDate = storeData
                        .slice(0, currentMonth)
                        .reduce((sum, item) => sum + item.매장제품구매금액, 0);

                      return (
                        <div key={store.id} className="bg-white rounded-lg border border-neutral-200 p-3">
                          <div className="mb-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {store.franchise?.name || ""} - {store.name}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600">이번달 구매량</span>
                              <span className="text-sm font-semibold text-blue-600">
                                {formatCurrency(thisMonthData?.매장제품구매금액 || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-600">연간 누적 구매량</span>
                              <span className="text-sm font-semibold text-[#967d5a]">
                                {formatCurrency(yearToDate || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                {selectedStoreIds.includes("all") || selectedStoreIds.length === 0 ? (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">전체 이번달 합계</span>
                        <span className="text-base font-bold text-blue-600">
                          {(() => {
                            const currentMonth = new Date().getMonth() + 1;
                            const currentMonthData = monthlyStoreData.find((item) => item.month === `${currentMonth}월`) || monthlyStoreData[monthlyStoreData.length - 1];
                            return formatCurrency(currentMonthData?.매장제품구매금액 || 0);
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">전체 연간 누적</span>
                        <span className="text-base font-bold text-[#967d5a]">
                          {(() => {
                            const currentMonth = new Date().getMonth() + 1;
                            const yearToDateTotal = monthlyStoreData
                              .slice(0, currentMonth)
                              .reduce((sum, item) => sum + item.매장제품구매금액, 0);
                            return formatCurrency(yearToDateTotal);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">선택 매장 이번달 합계</span>
                        <span className="text-base font-bold text-blue-600">
                          {(() => {
                            const currentMonth = new Date().getMonth() + 1;
                            const currentMonthData = monthlyStoreData.find((item) => item.month === `${currentMonth}월`) || monthlyStoreData[monthlyStoreData.length - 1];
                            return formatCurrency(currentMonthData?.매장제품구매금액 || 0);
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">선택 매장 연간 누적</span>
                        <span className="text-base font-bold text-[#967d5a]">
                          {(() => {
                            const currentMonth = new Date().getMonth() + 1;
                            const yearToDateTotal = monthlyStoreData
                              .slice(0, currentMonth)
                              .reduce((sum, item) => sum + item.매장제품구매금액, 0);
                            return formatCurrency(yearToDateTotal);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 매장 선택 필터 */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">매장 선택</h3>
              <p className="mt-1 text-sm text-slate-500">매장을 선택하여 해당 매장의 통계를 확인하세요 (여러 매장 선택 가능)</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStoreIds.includes("all")}
                  onChange={() => handleStoreToggle("all")}
                  className="w-4 h-4 text-[#967d5a] border-neutral-300 rounded focus:ring-[#967d5a] focus:ring-2"
                />
                <span className="text-sm font-medium text-slate-700">전체 매장</span>
              </label>
              {stores.map((store) => (
                <label key={store.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStoreIds.includes(store.id)}
                    onChange={() => handleStoreToggle(store.id)}
                    disabled={selectedStoreIds.includes("all")}
                    className="w-4 h-4 text-[#967d5a] border-neutral-300 rounded focus:ring-[#967d5a] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`text-sm font-medium ${selectedStoreIds.includes("all") ? "text-slate-400" : "text-slate-700"}`}>
                    {store.franchise?.name || ""} - {store.name}
                  </span>
                </label>
              ))}
            </div>
            {selectedStoreIds.length > 0 && !selectedStoreIds.includes("all") && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">{selectedStoreIds.length}개 매장</span>이 선택되었습니다. 선택된 매장들의 합산 데이터가 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 월별 제품별 구매금액 */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              월별 제품별 구매금액
              {!selectedStoreIds.includes("all") && selectedStoreIds.length > 0 && (
                <span className="ml-2 text-base font-normal text-slate-500">
                  ({selectedStoreIds.length}개 매장 합산)
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-500">월별 제품별 구매금액 현황을 확인하세요</p>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyProductData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis
                stroke="#64748b"
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="돼지국밥" fill="#967d5a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="수육" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="냉면" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="김치찌개" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* 매장 선택 필터 */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">매장 선택</h3>
              <p className="mt-1 text-sm text-slate-500">매장을 선택하여 해당 매장의 통계를 확인하세요 (여러 매장 선택 가능)</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStoreIds.includes("all")}
                  onChange={() => handleStoreToggle("all")}
                  className="w-4 h-4 text-[#967d5a] border-neutral-300 rounded focus:ring-[#967d5a] focus:ring-2"
                />
                <span className="text-sm font-medium text-slate-700">전체 매장</span>
              </label>
              {stores.map((store) => (
                <label key={store.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStoreIds.includes(store.id)}
                    onChange={() => handleStoreToggle(store.id)}
                    disabled={selectedStoreIds.includes("all")}
                    className="w-4 h-4 text-[#967d5a] border-neutral-300 rounded focus:ring-[#967d5a] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className={`text-sm font-medium ${selectedStoreIds.includes("all") ? "text-slate-400" : "text-slate-700"}`}>
                    {store.franchise?.name || ""} - {store.name}
                  </span>
                </label>
              ))}
            </div>
            {selectedStoreIds.length > 0 && !selectedStoreIds.includes("all") && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">{selectedStoreIds.length}개 매장</span>이 선택되었습니다. 선택된 매장들의 합산 데이터가 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#967d5a]"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-[#967d5a]/10 p-3">
                    <Icon className="h-6 w-6 text-[#967d5a]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900">{action.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 최근 활동 (추후 구현) */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">최근 활동</h2>
          <TrendingUp className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">최근 활동 내역이 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}
