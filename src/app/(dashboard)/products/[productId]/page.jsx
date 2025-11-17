"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Factory,
  Gauge,
  PackageSearch,
  ShoppingCart,
  Truck,
  Loader2,
} from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError("제품을 찾을 수 없습니다.");
        } else {
          throw new Error(data.error || "제품 정보를 불러오는데 실패했습니다.");
        }
        return;
      }

      // 데이터베이스 필드명(snake_case)을 camelCase로 변환
      const transformedProduct = {
        id: data.product.id,
        name: data.product.name,
        sku: data.product.sku,
        description: data.product.description || "",
        price: parseFloat(data.product.price),
        currency: data.product.currency || "KRW",
        uom: data.product.uom,
        weightGrams: data.product.weight_grams,
        taxRate: parseFloat(data.product.tax_rate) / 100, // DB는 10.00 형태, 프론트는 0.1 형태
        categoryId: data.product.category_id,
        isShippable: data.product.is_shippable,
        leadTimeDays: data.product.lead_time_days,
        stock: data.product.stock,
        imageUrl: data.product.image_url,
        isActive: data.product.is_active,
        // 계산된 필드
        unitLabel: `₩${parseFloat(data.product.price).toLocaleString()} / ${data.product.uom}`,
        categoryName: "상품", // 추후 카테고리 조인으로 가져올 수 있음
      };

      setProduct(transformedProduct);
    } catch (err) {
      console.error("Product fetch error:", err);
      setError(err.message || "제품 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#967d5a]" />
          <p className="mt-4 text-sm text-slate-500">제품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-sm text-red-600">{error || "제품을 찾을 수 없습니다."}</p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white hover:bg-[#7a6548]"
          >
            <ArrowLeft className="h-4 w-4" />
            제품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = product.price;
  const vat = product.price * product.taxRate;
  const total = subtotal + vat;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4460ff22,transparent_55%)]" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-20 pt-24">
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            상품 리스트로 돌아가기
          </Link>

          <header>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.32em] text-white/50">
              <span>{product.categoryName}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{product.sku}</span>
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-6 max-w-3xl text-base text-white/80 sm:text-lg">
              {product.description}
            </p>
          </header>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={ShoppingCart}
              label="공급가 (VAT 별도)"
              value={currencyFormatter.format(subtotal)}
            />
            <SummaryCard
              icon={Gauge}
              label="리드타임"
              value={
                product.leadTimeDays ? `${product.leadTimeDays}일` : "당일 배송"
              }
            />
            <SummaryCard
              icon={PackageSearch}
              label="재고 가용 수량"
              value={`${product.stock.toLocaleString()} ${product.uom.toUpperCase()}`}
            />
            <SummaryCard
              icon={Factory}
              label="배송 가능 여부"
              value={product.isShippable ? "전국 배송 가능" : "픽업 전용"}
            />
          </div>
        </div>
      </section>

      <div className="-mt-16 pb-24">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">가격 요약</h2>
                  <dl className="mt-5 space-y-3 text-sm">
                    <PriceRow label="상품 공급가" value={currencyFormatter.format(subtotal)} />
                    <PriceRow label="부가세" value={currencyFormatter.format(vat)} />
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-base font-semibold text-slate-900">
                      <dt>총 결제 예정액</dt>
                      <dd className="text-blue-600">{currencyFormatter.format(total)}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-slate-500">
                    * 결제시점 스냅샷으로 세금계산서가 발행되며, 결제 방식(선결제/월말정산)에 따라
                    총액이 조정될 수 있습니다.
                  </p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">물류 및 규격</h2>
                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <SpecItem label="단위(UOM)" value={product.uom.toUpperCase()} />
                    <SpecItem
                      label="중량"
                      value={
                        product.weightGrams
                          ? `${(product.weightGrams / 1000).toFixed(1)} kg`
                          : "-"
                      }
                    />
                    <SpecItem label="부가세율" value={`${product.taxRate * 100}%`} />
                    <SpecItem
                      label="카테고리 코드"
                      value={`#${product.categoryId.toUpperCase()}`}
                    />
                    <SpecItem
                      label="배송 리드타임"
                      value={product.leadTimeDays ? `${product.leadTimeDays}일` : "당일 배송"}
                    />
                    <SpecItem label="배송 가능" value={product.isShippable ? "가능" : "제한"} />
                  </dl>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Truck className="h-5 w-5 text-blue-600" />
                  배송 타임라인
                </h2>
                <ol className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                  <TimelineStep
                    step="01"
                    title="주문 접수"
                    description="1영업일 내 본사 Fulfillment 팀이 발주내역을 검토합니다."
                  />
                  <TimelineStep
                    step="02"
                    title="피킹 & 검수"
                    description="재고 피킹 후 품질 검수 및 출고 스캔을 진행합니다."
                  />
                  <TimelineStep
                    step="03"
                    title="배송 및 납품"
                    description="리드타임 기준 납품일에 맞춰 배송이 완료되며, 미도착 시 자동 알림이 발송됩니다."
                  />
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  주문 준비 체크리스트
                </h2>
                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  <ChecklistItem text="필요 수량과 희망 납품일을 확정합니다." />
                  <ChecklistItem text="납품지 주소와 수령 책임자 정보를 최신 상태로 유지합니다." />
                  <ChecklistItem text="월별 한도 또는 HQ 승인 여부를 확인합니다." />
                </ul>
              </div>
            </section>

            <aside className="flex flex-col gap-6 rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 via-white to-white p-8 shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">구매 요청 시작</h3>
                <p className="mt-3 text-sm text-slate-600">
                  발주량, 납품 일정, 결제 조건을 입력하면 자동으로 주문서가 생성됩니다. 제출 후에도
                  Fulfillment 팀과 바로 협의가 가능합니다.
                </p>
              </div>

              <Link
                href={`/orders/new?productId=${product.id}`}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                구매 요청 작성
              </Link>
              <p className="text-xs text-slate-500">
                * 주문 작성 페이지는 추후 구현 예정이며, 현재는 디자인 목업용 링크입니다.
              </p>

              <div className="space-y-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  재고가 충분합니다. 즉시 주문 가능
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  월별 권장 주문량: {Math.max(1, Math.round(product.stock / 8))} {product.uom}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  리드타임 변동이 있는 경우 별도 알림이 전송됩니다.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-white/60">{label}</p>
        <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function PriceRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function SpecItem({ label, value }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white px-4 py-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-2 text-base font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function TimelineStep({ step, title, description }) {
  return (
    <li className="flex flex-col rounded-2xl border border-slate-100 bg-white px-5 py-6 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
        {step}
      </span>
      <h3 className="mt-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </li>
  );
}

function ChecklistItem({ text }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
      <span>{text}</span>
    </li>
  );
}

