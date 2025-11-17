"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, ShieldCheck } from "lucide-react";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    zone: "",
    apiKey: "",
    sessionId: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/ecount/keys");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "키 목록을 불러오는데 실패했습니다.");
      }
      setKeys(data.keys || []);
    } catch (err) {
      setError(err.message || "키 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label || !form.apiKey) {
      setError("라벨과 API KEY를 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch("/api/integrations/ecount/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "API 키 저장에 실패했습니다.");
      }
      setKeys((prev) => [data.key, ...prev]);
      setForm({ label: "", zone: "", apiKey: "", sessionId: "" });
    } catch (err) {
      setError(err.message || "API 키 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("해당 키를 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
    
    try {
      const response = await fetch(`/api/integrations/ecount/keys/${id}`, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "삭제에 실패했습니다.");
      }
      
      // 성공 시 목록에서 제거
      setKeys((prev) => prev.filter((key) => key.id !== id));
      alert("API 키가 삭제되었습니다.");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message || "API 키 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 space-y-8">
      <div>
        <p className="text-sm font-medium text-[#967d5a]">ERP 연동</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Ecount API 키 관리</h1>
        <p className="mt-1 text-sm text-slate-500">ERP 연동에 사용할 여러 개의 키를 저장하고 관리할 수 있습니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ShieldCheck className="h-4 w-4 text-[#967d5a]" />
          새 API 키 등록
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            라벨
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="예: 기본 ERP 키"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            ZONE (선택)
            <input
              type="text"
              value={form.zone}
              onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))}
              placeholder="예: 001"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            API KEY 또는 SESSION ID
            <input
              type="text"
              value={form.apiKey}
              onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder="발급 받은 API KEY 입력"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            별도 SESSION ID (선택)
            <input
              type="text"
              value={form.sessionId}
              onChange={(e) => setForm((prev) => ({ ...prev, sessionId: e.target.value }))}
              placeholder="별도 세션 값이 있을 경우 입력"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
            />
          </label>
        </div>
        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#967d5a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7a6548] disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            "API 키 저장"
          )}
        </button>
      </form>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">등록된 키</h2>
          <span className="text-sm text-slate-500">{keys.length}개</span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            불러오는 중...
          </div>
        ) : keys.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-slate-400">
            등록된 API 키가 없습니다.
          </p>
        ) : (
          <ul className="space-y-3">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{key.label}</p>
                  <p className="text-xs text-slate-500">
                    ZONE: {key.zone || "기본"} · 등록일 {new Date(key.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(key.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

