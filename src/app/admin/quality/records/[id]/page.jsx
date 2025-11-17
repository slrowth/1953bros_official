"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Minus, Calendar, Building2, Store, User } from "lucide-react";

export default function RecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id;
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (recordId) {
      fetchRecord();
    }
  }, [recordId]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/quality/records/${recordId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "점검 기록을 불러오는데 실패했습니다.");
      }

      setRecord(data.record);
    } catch (err) {
      console.error("Fetch record error:", err);
      setError(err.message || "점검 기록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PASS":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "FAIL":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "N/A":
        return <Minus className="h-5 w-5 text-slate-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PASS":
        return "합격";
      case "FAIL":
        return "불합격";
      case "N/A":
        return "해당없음";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PASS":
        return "bg-green-50 text-green-800 border-green-200";
      case "FAIL":
        return "bg-red-50 text-red-800 border-red-200";
      case "N/A":
        return "bg-slate-50 text-slate-600 border-slate-200";
      default:
        return "bg-neutral-50 text-neutral-800 border-neutral-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">점검 기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error || "점검 기록을 찾을 수 없습니다."}
        </div>
        <Link
          href="/admin/quality"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
      </div>
    );
  }

  const totalItems = record.items?.length || 0;
  const passedItems = record.items?.filter((item) => item.status === "PASS").length || 0;
  const failedItems = record.items?.filter((item) => item.status === "FAIL").length || 0;
  const naItems = record.items?.filter((item) => item.status === "N/A").length || 0;
  const passRate = totalItems > 0 ? (passedItems / totalItems) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6">
        <Link
          href="/admin/quality"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
      </div>

      {/* 헤더 정보 */}
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {record.checklist?.title || "점검 기록"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">버전 {record.checklistVersion}</p>
          </div>
          <div
            className={`rounded-full px-4 py-2 ${
              failedItems > 0
                ? "bg-red-100 text-red-800"
                : passRate === 100
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            <span className="text-sm font-semibold">
              {failedItems > 0
                ? `불합격 (${failedItems}건)`
                : passRate === 100
                ? "합격"
                : `부분합격 (${passRate.toFixed(0)}%)`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-neutral-200 pt-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">점검일</p>
              <p className="font-medium text-slate-900">{formatDate(record.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">프랜차이즈</p>
              <p className="font-medium text-slate-900">{record.franchise?.name || "-"}</p>
            </div>
          </div>
          {record.store && (
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">매장</p>
                <p className="font-medium text-slate-900">{record.store.name}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">점검자</p>
              <p className="font-medium text-slate-900">{record.completedBy?.email || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-slate-500">전체 항목</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalItems}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-700">합격</p>
          <p className="mt-1 text-2xl font-semibold text-green-800">{passedItems}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-700">불합격</p>
          <p className="mt-1 text-2xl font-semibold text-red-800">{failedItems}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-600">해당없음</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{naItems}</p>
        </div>
      </div>

      {/* 점검 항목 목록 */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">점검 항목 상세</h2>
        <div className="space-y-3">
          {record.items && record.items.length > 0 ? (
            record.items
              .sort((a, b) => (a.item?.order || 0) - (b.item?.order || 0))
              .map((recordItem, index) => (
                <div
                  key={recordItem.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#967d5a]/10 text-sm font-semibold text-[#967d5a]">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {recordItem.item?.label || "항목 정보 없음"}
                      </p>
                      {recordItem.comment && (
                        <p className="mt-2 text-sm text-slate-600">{recordItem.comment}</p>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${getStatusColor(
                        recordItem.status
                      )}`}
                    >
                      {getStatusIcon(recordItem.status)}
                      <span className="text-sm font-medium">
                        {getStatusLabel(recordItem.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-sm text-slate-500">점검 항목이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 비고 */}
      {record.notes && (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">비고</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.notes}</p>
        </div>
      )}
    </div>
  );
}

