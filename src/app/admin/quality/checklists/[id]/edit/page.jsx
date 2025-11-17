"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

export default function EditChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const checklistId = params.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isActive: true,
    items: [{ label: "", order: 0 }],
  });

  useEffect(() => {
    if (checklistId) {
      fetchChecklist();
    }
  }, [checklistId]);

  const fetchChecklist = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/quality/checklists/${checklistId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "체크리스트를 불러오는데 실패했습니다.");
      }

      setFormData({
        title: data.checklist.title || "",
        description: data.checklist.description || "",
        isActive: data.checklist.isActive,
        items: data.checklist.items.length > 0
          ? data.checklist.items.map((item) => ({
              label: item.label,
              order: item.order,
            }))
          : [{ label: "", order: 0 }],
      });
    } catch (error) {
      console.error("Fetch checklist error:", error);
      alert(error.message || "체크리스트를 불러오는 중 오류가 발생했습니다.");
      router.push("/admin/quality/checklists");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || formData.title.trim() === "") {
        alert("제목을 입력해주세요.");
        setLoading(false);
        return;
      }

      const validItems = formData.items.filter((item) => item.label.trim() !== "");
      if (validItems.length === 0) {
        alert("최소 1개 이상의 항목을 입력해주세요.");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/quality/checklists/${checklistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          items: validItems.map((item, index) => ({
            label: item.label.trim(),
            order: index,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "체크리스트 수정에 실패했습니다.");
      }

      alert("체크리스트가 수정되었습니다.");
      router.push("/admin/quality/checklists");
    } catch (error) {
      console.error("Update checklist error:", error);
      alert(error.message || "체크리스트 수정에 실패했습니다.");
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

  const handleItemChange = (index, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], label: value };
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { label: "", order: prev.items.length }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) {
      alert("최소 1개 이상의 항목이 필요합니다.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })),
    }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">체크리스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/quality/checklists"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-semibold text-slate-900">체크리스트 수정</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                placeholder="예: 위생 점검 체크리스트"
              />
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
                설명
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                placeholder="체크리스트에 대한 설명을 입력하세요"
              />
            </div>

            {/* 활성화 상태 */}
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

            {/* 항목 목록 */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  점검 항목 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                >
                  <Plus className="h-4 w-4" />
                  항목 추가
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#967d5a]/10 text-sm font-medium text-[#967d5a]">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                      placeholder="점검 항목을 입력하세요"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length <= 1}
                      className="rounded-lg border border-red-300 bg-white p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/admin/quality/checklists"
                className="rounded-lg border border-neutral-300 bg-white px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#967d5a]/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? "수정 중..." : "수정"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

