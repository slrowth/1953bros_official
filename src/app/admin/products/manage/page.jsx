"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function ManageProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState("all"); // all, active, inactive
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // 제품 목록 가져오기
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "제품 목록을 불러오는데 실패했습니다.");
      }

      // 데이터베이스 필드명(snake_case)을 camelCase로 변환
      const transformedProducts = data.products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        price: parseFloat(product.price),
        currency: product.currency || "KRW",
        uom: product.uom,
        weightGrams: product.weight_grams,
        taxRate: parseFloat(product.tax_rate), // DB는 10.00 형태
        categoryId: product.category_id,
        categoryName: product.category?.name || "기타",
        stock: product.stock,
        imageUrl: product.image_url,
        isActive: product.is_active,
        isShippable: product.is_shippable,
        leadTimeDays: product.lead_time_days,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error("Products fetch error:", err);
      setError(err.message || "제품 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  // 필터링된 제품 목록
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query))
      );
    }

    // 카테고리 필터
    if (filterCategory) {
      filtered = filtered.filter((product) => product.categoryId === filterCategory);
    }

    // 활성화 상태 필터
    if (filterActive === "active") {
      filtered = filtered.filter((product) => product.isActive);
    } else if (filterActive === "inactive") {
      filtered = filtered.filter((product) => !product.isActive);
    }

    return filtered;
  }, [products, searchQuery, filterCategory, filterActive]);

  // 수정 시작
  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setEditFormData({
      name: product.name,
      sku: product.sku,
      description: product.description,
      categoryId: product.categoryId,
      price: product.price.toString(),
      currency: product.currency,
      stock: product.stock.toString(),
      isActive: product.isActive,
      imageUrl: product.imageUrl || "",
      uom: product.uom,
      weightGrams: product.weightGrams ? product.weightGrams.toString() : "",
      taxRate: product.taxRate.toString(),
      isShippable: product.isShippable,
      leadTimeDays: product.leadTimeDays ? product.leadTimeDays.toString() : "",
    });
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData(null);
  };

  // 수정 저장
  const handleSaveEdit = async (productId) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editFormData.name,
          sku: editFormData.sku,
          description: editFormData.description || null,
          categoryId: editFormData.categoryId,
          price: parseFloat(editFormData.price),
          currency: editFormData.currency,
          stock: parseInt(editFormData.stock) || 0,
          isActive: editFormData.isActive,
          imageUrl: editFormData.imageUrl || null,
          uom: editFormData.uom,
          weightGrams: editFormData.weightGrams ? parseInt(editFormData.weightGrams) : null,
          taxRate: parseFloat(editFormData.taxRate),
          isShippable: editFormData.isShippable,
          leadTimeDays: editFormData.leadTimeDays ? parseInt(editFormData.leadTimeDays) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "상품 수정에 실패했습니다.");
      }

      alert("상품이 수정되었습니다.");
      setEditingProduct(null);
      setEditFormData(null);
      fetchProducts(); // 목록 새로고침
    } catch (error) {
      console.error("Update product error:", error);
      alert(error.message || "상품 수정에 실패했습니다.");
    }
  };

  // 삭제
  const handleDelete = async (productId) => {
    const product = products.find((p) => p.id === productId);
    const confirmed = window.confirm(
      `"${product?.name}" 상품을 삭제하시겠습니까?\n\n주문에 포함된 상품인 경우 삭제 대신 비활성화됩니다.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProductId(productId);
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "상품 삭제에 실패했습니다.");
      }

      alert(data.message || "상품이 삭제되었습니다.");
      fetchProducts(); // 목록 새로고침
    } catch (error) {
      console.error("Delete product error:", error);
      alert(error.message || "상품 삭제에 실패했습니다.");
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">제품 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">상품 관리</h1>
          <p className="mt-1 text-sm text-slate-500">상품을 등록, 수정, 삭제할 수 있습니다.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#967d5a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7a6548]"
        >
          <Plus className="h-4 w-4" />
          상품 등록
        </Link>
      </div>

      {/* 필터 및 검색 */}
      <div className="mb-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="상품명, SKU로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-4 py-2 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
              />
            </div>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          >
            <option value="">전체 카테고리</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성화</option>
            <option value="inactive">비활성화</option>
          </select>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 제품 목록 */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">상품명</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">카테고리</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">가격</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">재고</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-600">상태</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                    {searchQuery || filterCategory || filterActive !== "all"
                      ? "검색 결과가 없습니다."
                      : "등록된 상품이 없습니다."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50">
                    {editingProduct === product.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => handleEditFormChange("name", e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editFormData.sku}
                            onChange={(e) => handleEditFormChange("sku", e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editFormData.categoryId}
                            onChange={(e) => handleEditFormChange("categoryId", e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editFormData.price}
                            onChange={(e) => handleEditFormChange("price", e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editFormData.stock}
                            onChange={(e) => handleEditFormChange("stock", e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editFormData.isActive}
                              onChange={(e) => handleEditFormChange("isActive", e.target.checked)}
                              className="h-4 w-4 rounded border-neutral-300 text-[#967d5a] focus:ring-[#967d5a]"
                            />
                            <span className="text-xs text-slate-600">활성</span>
                          </label>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(product.id)}
                              className="rounded-lg bg-[#967d5a] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#7a6548]"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-neutral-50"
                            >
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                                <Package className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{product.name}</div>
                              {product.description && (
                                <div className="text-xs text-slate-500 line-clamp-1">{product.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.sku}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.categoryName}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {currencyFormatter.format(product.price)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.stock}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {product.isActive ? (
                              <>
                                <Eye className="mr-1 h-3 w-3" />
                                활성
                              </>
                            ) : (
                              <>
                                <EyeOff className="mr-1 h-3 w-3" />
                                비활성
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-neutral-50"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingProductId === product.id}
                              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingProductId === product.id ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-700 border-t-transparent"></div>
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500">전체 상품</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{products.length}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500">활성 상품</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">
            {products.filter((p) => p.isActive).length}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500">비활성 상품</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {products.filter((p) => !p.isActive).length}
          </div>
        </div>
      </div>
    </div>
  );
}
