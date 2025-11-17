"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

export default function NewChecklistPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    items: [{ label: "", order: 0 }],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 필수 필드 검증
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

      const response = await fetch("/api/quality/checklists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          items: validItems.map((item, index) => ({
            label: item.label.trim(),
            order: index,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "체크리스트 등록에 실패했습니다.");
      }

      alert("체크리스트가 등록되었습니다.");
      router.push("/admin/quality/checklists");
    } catch (error) {
      console.error("Create checklist error:", error);
      alert(error.message || "체크리스트 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 확장자 확인
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(fileExtension)) {
      alert("Excel 파일(.xlsx, .xls)만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // 첫 번째 시트 가져오기
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 시트를 JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        // 빈 행 제거 및 항목 추출
        const items = [];
        jsonData.forEach((row, rowIndex) => {
          // 첫 번째 열(A열)의 값을 항목으로 사용
          const cellValue = row[0];
          if (cellValue && typeof cellValue === "string" && cellValue.trim() !== "") {
            // 첫 번째 행이 헤더일 가능성이 있으므로, 숫자나 특정 패턴이 아닌 경우만 추가
            // 또는 모든 행을 항목으로 추가 (사용자가 헤더를 포함하지 않도록 안내)
            items.push(cellValue.trim());
          }
        });

        if (items.length === 0) {
          alert("Excel 파일에서 항목을 찾을 수 없습니다. 첫 번째 열(A열)에 항목 내용을 입력해주세요.");
          return;
        }

        // 기존 항목과 병합 (빈 항목 제거 후 추가)
        const existingItems = formData.items.filter((item) => item.label.trim() !== "");
        const newItems = items.map((label, index) => ({
          label,
          order: existingItems.length + index,
        }));

        setFormData((prev) => ({
          ...prev,
          items: [...existingItems, ...newItems],
        }));

        alert(`Excel 파일에서 ${items.length}개의 항목을 추가했습니다.`);
      } catch (error) {
        console.error("Excel 파일 읽기 오류:", error);
        alert("Excel 파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.");
      }
    };

    reader.onerror = () => {
      alert("파일을 읽는 중 오류가 발생했습니다.");
    };

    reader.readAsArrayBuffer(file);

    // 파일 input 초기화 (같은 파일을 다시 선택할 수 있도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExcelButtonClick = () => {
    fileInputRef.current?.click();
  };

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
          <h1 className="mb-6 text-2xl font-semibold text-slate-900">체크리스트 등록</h1>

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

            {/* 항목 목록 */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  점검 항목 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExcelButtonClick}
                    className="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:bg-green-100"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel로 한번에 추가
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                  >
                    <Plus className="h-4 w-4" />
                    항목 추가
                  </button>
                </div>
              </div>
              <div className="mb-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                💡 Excel 파일 형식: 첫 번째 열(A열)에 항목 내용을 입력하세요. 첫 번째 행은 헤더로 사용할 수 있습니다.
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
                {loading ? "등록 중..." : "등록"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

