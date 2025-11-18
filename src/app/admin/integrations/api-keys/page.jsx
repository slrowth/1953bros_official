"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "",
    zone: "",
    apiKey: "",
    sessionId: "",
    comCode: "",
  });
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(null); // 검증 중인 키 ID
  const [verificationResult, setVerificationResult] = useState(null);
  const [showSessionIdInput, setShowSessionIdInput] = useState(null); // SESSION_ID 입력 모달을 표시할 키 ID
  const [sessionIdInput, setSessionIdInput] = useState(""); // 사용자가 입력한 SESSION_ID

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
    if (!form.label || !form.apiKey || !form.sessionId || !form.comCode || !form.zone) {
      setError("모든 필수 항목(라벨, ZONE, USER_ID, API_CERT_KEY, COM_CODE)을 입력해주세요.");
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

      if (!response.ok) {
        let errorMessage = "API 키 저장에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setKeys((prev) => [data.key, ...prev]);
      setForm({ label: "", zone: "", apiKey: "", sessionId: "", comCode: "" });
    } catch (err) {
      console.error("API 키 저장 오류:", err);
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

  const handleVerify = async (keyId, useManualSessionId = false) => {
    if (!useManualSessionId) {
      if (!confirm("테스트 인증키로 검증 요청을 전송하시겠습니까?\n\n이카운트에서 확인 후 운영 인증키를 발급받을 수 있습니다.")) {
        return;
      }
    }

    try {
      setVerifying(keyId);
      setVerificationResult(null);
      setError("");

      const requestBody = { keyId };
      if (useManualSessionId && sessionIdInput.trim()) {
        requestBody.sessionId = sessionIdInput.trim();
      }

      const response = await fetch("/api/integrations/ecount/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // SESSION_ID 입력이 필요한 경우
        if (data.requiresSessionId) {
          setShowSessionIdInput(keyId);
          setVerifying(null);
          return;
        }
        throw new Error(data.error || "검증 요청에 실패했습니다.");
      }

      setVerificationResult({
        success: data.success,
        message: data.message || data.error,
        details: data.details,
      });

      if (data.success) {
        alert("✅ 검증 요청이 성공적으로 전송되었습니다.\n\n이카운트에서 확인 후 운영 인증키를 발급받으세요.");
        setShowSessionIdInput(null);
        setSessionIdInput("");
      } else {
        alert(`❌ 검증 요청 실패:\n${data.error || data.message}`);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message || "검증 요청 중 오류가 발생했습니다.");
      alert(`검증 요청 중 오류가 발생했습니다:\n${err.message}`);
    } finally {
      setVerifying(null);
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
            ZONE <span className="text-xs text-red-500">*필수</span>
            <input
              type="text"
              value={form.zone}
              onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))}
              placeholder="예: C, CB, B, D 등 (2자리)"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
              required
              maxLength={2}
            />
            <p className="text-xs text-slate-400">이카운트 도메인 ZONE (2자리, 예: C, CB, B, D)</p>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            USER_ID (사용자 ID) <span className="text-xs text-red-500">*필수</span>
            <input
              type="text"
              value={form.sessionId}
              onChange={(e) => setForm((prev) => ({ ...prev, sessionId: e.target.value }))}
              placeholder="API_CERT_KEY를 발급받은 이카운트 ID"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
              required
              maxLength={30}
            />
            <p className="text-xs text-slate-400">API_CERT_KEY를 발급받은 이카운트 로그인 ID (최대 30자)</p>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            API_CERT_KEY (인증키) <span className="text-xs text-red-500">*필수</span>
            <input
              type="text"
              value={form.apiKey}
              onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder="이카운트 > Self-Customizing > 정보관리 > API인증키발급"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
              required
              maxLength={50}
            />
            <div className="space-y-1">
              <p className="text-xs text-slate-400">이카운트ERP에서 발급받은 인증키 (최대 50자)</p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                <p className="font-semibold">⚠️ 중요: 실제 주문 처리를 위해서는 운영 인증키가 필요합니다</p>
                <p className="mt-1">• 테스트 인증키: 개발/테스트용 (실제 주문 처리 불가)</p>
                <p>• 운영 인증키: 검증 완료 후 발급 (실제 주문 처리 가능)</p>
                <p className="mt-1 font-semibold">운영 인증키 발급 방법:</p>
                <ol className="ml-4 list-decimal space-y-0.5">
                  <li>이카운트 ERP 로그인</li>
                  <li>Self-Customizing &gt; 정보관리 &gt; API인증키발급</li>
                  <li>운영 인증키 발급 요청 (이카운트 담당자에게 검증 요청 필요할 수 있음)</li>
                  <li>발급받은 운영 인증키를 여기에 입력</li>
                </ol>
              </div>
            </div>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            COM_CODE (회사 코드) <span className="text-xs text-red-500">*필수</span>
            <input
              type="text"
              value={form.comCode}
              onChange={(e) => setForm((prev) => ({ ...prev, comCode: e.target.value }))}
              placeholder="예: 80001 (6자리)"
              className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none"
              required
              maxLength={6}
            />
            <p className="text-xs text-slate-400">이카운트 ERP 로그인 시 사용하는 회사 코드 (6자리)</p>
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
              <li key={key.id} className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{key.label}</p>
                    <p className="text-xs text-slate-500">
                      ZONE: {key.zone || "기본"} · 등록일 {new Date(key.created_at).toLocaleString("ko-KR")}
                    </p>
                    {verificationResult && verificationResult.success && (
                      <p className="mt-1 text-xs text-green-600">✅ 검증 요청 전송 완료</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerify(key.id)}
                      disabled={verifying === key.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[#967d5a] bg-white px-3 py-1 text-xs font-semibold text-[#967d5a] transition hover:bg-[#967d5a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verifying === key.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          검증 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          검증 요청
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(key.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  </div>
                </div>
                {/* SESSION_ID 입력 모달 */}
                {showSessionIdInput === key.id && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-amber-900">SESSION_ID 직접 입력</p>
                    <p className="mb-3 text-xs text-amber-800">
                      테스트 인증키 응답에 SESSION_ID가 없습니다. 직접 SESSION_ID를 입력하여 검증 요청을 보낼 수 있습니다.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sessionIdInput}
                        onChange={(e) => setSessionIdInput(e.target.value)}
                        placeholder="SESSION_ID를 입력하세요"
                        className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerify(key.id, true)}
                        disabled={!sessionIdInput.trim() || verifying === key.id}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        전송
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSessionIdInput(null);
                          setSessionIdInput("");
                        }}
                        className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

