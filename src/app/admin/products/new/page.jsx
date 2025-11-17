"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    categoryId: "",
    price: "",
    currency: "KRW",
    stock: "0",
    isActive: true,
    imageUrl: "",
    uom: "",
    weightGrams: "",
    taxRate: "10.0",
    isShippable: true,
    leadTimeDays: "",
  });

  // 카테고리 목록 가져오기
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/product-categories");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "카테고리 목록을 불러올 수 없습니다.");
      }

      setCategories(data.categories || []);
    } catch (error) {
      console.error("Categories fetch error:", error);
      alert(error.message || "카테고리 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 필수 필드 검증
      if (!formData.name || !formData.sku || !formData.categoryId || !formData.price || !formData.uom) {
        alert("필수 필드를 모두 입력해주세요.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description || null,
          categoryId: formData.categoryId,
          price: parseFloat(formData.price),
          currency: formData.currency,
          stock: parseInt(formData.stock) || 0,
          isActive: formData.isActive,
          imageUrl: formData.imageUrl || null,
          uom: formData.uom,
          weightGrams: formData.weightGrams ? parseInt(formData.weightGrams) : null,
          taxRate: parseFloat(formData.taxRate),
          isShippable: formData.isShippable,
          leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "상품 등록에 실패했습니다.");
      }

      alert("상품이 등록되었습니다.");
      router.push("/admin/products/manage");
    } catch (error) {
      console.error("Create product error:", error);
      alert(error.message || "상품 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products/manage"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-3xl font-bold text-slate-900">상품 등록</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
                  상품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  placeholder="상품명을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="sku" className="mb-2 block text-sm font-semibold text-slate-700">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  placeholder="예: FR-GD-100-10000"
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
                  설명
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  placeholder="상품 설명을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="categoryId" className="mb-2 block text-sm font-semibold text-slate-700">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                {loadingCategories ? (
                  <div className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-500">
                    카테고리 로딩 중...
                  </div>
                ) : (
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 가격 및 재고 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">가격 및 재고</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="mb-2 block text-sm font-semibold text-slate-700">
                    가격 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="mb-2 block text-sm font-semibold text-slate-700">
                    통화
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  >
                    <option value="KRW">KRW (원)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stock" className="mb-2 block text-sm font-semibold text-slate-700">
                    재고
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="uom" className="mb-2 block text-sm font-semibold text-slate-700">
                    단위 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="uom"
                    name="uom"
                    value={formData.uom}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                    placeholder="예: 10kg, 915g, 1개"
                  />
                </div>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">추가 정보</h2>

              <div>
                <label htmlFor="imageUrl" className="mb-2 block text-sm font-semibold text-slate-700">
                  이미지 URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weightGrams" className="mb-2 block text-sm font-semibold text-slate-700">
                    무게 (g)
                  </label>
                  <input
                    type="number"
                    id="weightGrams"
                    name="weightGrams"
                    value={formData.weightGrams}
                    onChange={handleChange}
                    min="0"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="taxRate" className="mb-2 block text-sm font-semibold text-slate-700">
                    세율 (%)
                  </label>
                  <input
                    type="number"
                    id="taxRate"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                    placeholder="10.0"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="leadTimeDays" className="mb-2 block text-sm font-semibold text-slate-700">
                  납기일 (일)
                </label>
                <input
                  type="number"
                  id="leadTimeDays"
                  name="leadTimeDays"
                  value={formData.leadTimeDays}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  placeholder="예: 3"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-neutral-300 text-[#967d5a] focus:ring-[#967d5a]"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    활성화
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isShippable"
                    name="isShippable"
                    checked={formData.isShippable}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-neutral-300 text-[#967d5a] focus:ring-[#967d5a]"
                  />
                  <label htmlFor="isShippable" className="text-sm font-medium text-slate-700">
                    배송 가능
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/admin/products/manage"
                className="rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-neutral-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#967d5a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7a6548] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? "등록 중..." : "등록"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
