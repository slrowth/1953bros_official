"use client";

import { useState, useEffect, useMemo } from "react";
import { UserCheck, UserX, Search, Filter, Calendar, Building2, Store, Mail, User, Phone, FileText, Edit2, Save, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "대기중", color: "bg-yellow-100 text-yellow-800" },
  { value: "APPROVED", label: "승인됨", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "거부됨", color: "bg-red-100 text-red-800" },
];

const ROLE_OPTIONS = [
  { value: "OWNER", label: "점주", color: "bg-purple-100 text-purple-800" },
  { value: "STAFF", label: "직원", color: "bg-blue-100 text-blue-800" },
  { value: "ADMIN", label: "관리자", color: "bg-gray-100 text-gray-800" },
];

export default function ApprovalsPage() {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // 통계용 전체 사용자 데이터
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingMemoUserId, setEditingMemoUserId] = useState(null);
  const [memoValues, setMemoValues] = useState({});
  const [savingMemoUserId, setSavingMemoUserId] = useState(null);

  useEffect(() => {
    fetchAllUsers(); // 전체 사용자 데이터 가져오기 (통계용)
  }, []);

  useEffect(() => {
    fetchUsers(); // 필터링된 사용자 데이터 가져오기 (목록용)
  }, [statusFilter]);

  // 통계용 전체 사용자 데이터 가져오기
  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`/api/users`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "사용자 목록을 불러오는데 실패했습니다.");
      }

      setAllUsers(data.users || []);
    } catch (err) {
      console.error("Fetch all users error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "사용자 목록을 불러오는데 실패했습니다.");
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "사용자 목록을 불러오는 중 오류가 발생했습니다.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm("이 사용자를 승인하시겠습니까?")) {
      return;
    }

    try {
      setUpdatingUserId(userId);

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "사용자 승인에 실패했습니다.");
      }

      alert("사용자가 승인되었습니다.");
      await fetchUsers();
      await fetchAllUsers(); // 통계 업데이트를 위해 전체 데이터도 다시 가져오기
    } catch (err) {
      console.error("Approve user error:", err);
      alert(err.message || "사용자 승인 중 오류가 발생했습니다.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleReject = async (userId) => {
    if (!confirm("이 사용자를 거부하시겠습니까?")) {
      return;
    }

    try {
      setUpdatingUserId(userId);

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "사용자 거부에 실패했습니다.");
      }

      alert("사용자가 거부되었습니다.");
      await fetchUsers();
      await fetchAllUsers(); // 통계 업데이트를 위해 전체 데이터도 다시 가져오기
    } catch (err) {
      console.error("Reject user error:", err);
      alert(err.message || "사용자 거부 중 오류가 발생했습니다.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleStartEditMemo = (userId, currentMemo) => {
    setEditingMemoUserId(userId);
    setMemoValues({ ...memoValues, [userId]: currentMemo || "" });
  };

  const handleCancelEditMemo = (userId) => {
    setEditingMemoUserId(null);
    setMemoValues({ ...memoValues, [userId]: "" });
  };

  const handleSaveMemo = async (userId) => {
    try {
      setSavingMemoUserId(userId);

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memo: memoValues[userId] || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 더 구체적인 에러 메시지
        const errorMsg = data.error || "메모 저장에 실패했습니다.";
        console.error("Save memo API error:", errorMsg, data);
        throw new Error(errorMsg);
      }

      setEditingMemoUserId(null);
      await fetchUsers();
      await fetchAllUsers(); // 통계 업데이트를 위해 전체 데이터도 다시 가져오기
    } catch (err) {
      console.error("Save memo error:", err);
      alert(err.message || "메모 저장 중 오류가 발생했습니다.\n데이터베이스에 memo 필드가 추가되었는지 확인해주세요.");
    } finally {
      setSavingMemoUserId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusOption?.color || "bg-gray-100 text-gray-800"}`}
      >
        {statusOption?.label || status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleOption?.color || "bg-gray-100 text-gray-800"}`}
      >
        {roleOption?.label || role}
      </span>
    );
  };

  // 필터링된 사용자 목록
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.name?.toLowerCase().includes(query) ||
          user.storeName?.toLowerCase().includes(query)
      );
    }

    // 역할 필터
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    return filtered;
  }, [users, searchQuery, roleFilter]);

  // 통계 계산 (전체 사용자 데이터 기반)
  const stats = useMemo(() => {
    return {
      pending: allUsers.filter((u) => u.status === "PENDING").length,
      approved: allUsers.filter((u) => u.status === "APPROVED").length,
      rejected: allUsers.filter((u) => u.status === "REJECTED").length,
      total: allUsers.length,
    };
  }, [allUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">회원가입 승인</h1>
        <p className="mt-1 text-sm text-slate-500">회원가입 신청을 승인하거나 거부할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">대기중</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.pending}명</p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-3">
              <UserCheck className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">승인됨</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.approved}명</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">거부됨</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.rejected}명</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">전체</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}명</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="이메일, 이름, 매장명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            >
              <option value="all">전체 상태</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
            >
              <option value="all">전체 역할</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          총 <span className="font-semibold text-slate-900">{filteredUsers.length}</span>명
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* 사용자 목록 */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <UserCheck className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-900">사용자가 없습니다</p>
            <p className="mt-1 text-sm text-slate-500">조건에 맞는 사용자가 없습니다.</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-900">{user.email}</span>
                      </div>
                      {getStatusBadge(user.status)}
                      {getRoleBadge(user.role)}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                      {user.name && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">이름:</span>
                          <span>{user.name}</span>
                        </div>
                      )}
                      {user.position && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">직책:</span>
                          <span>{user.position}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">전화번호:</span>
                        <span>{user.phone ? user.phone : <span className="text-slate-400">없음</span>}</span>
                      </div>
                      {user.franchise && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">가맹점:</span>
                          <span>{user.franchise.name}</span>
                        </div>
                      )}
                      {user.store && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Store className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">매장:</span>
                          <span>{user.store.name}</span>
                        </div>
                      )}
                    </div>

                    {/* 메모 섹션 */}
                    <div className="mt-4 border-t border-neutral-200 pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">메모</span>
                          </div>
                          {editingMemoUserId === user.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={memoValues[user.id] || ""}
                                onChange={(e) =>
                                  setMemoValues({ ...memoValues, [user.id]: e.target.value })
                                }
                                placeholder="메모를 입력하세요..."
                                rows={3}
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20 resize-none"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveMemo(user.id)}
                                  disabled={savingMemoUserId === user.id}
                                  className="flex items-center gap-2 rounded-lg bg-[#967d5a] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#7a6548] disabled:opacity-50"
                                >
                                  <Save className="h-3 w-3" />
                                  {savingMemoUserId === user.id ? "저장 중..." : "저장"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelEditMemo(user.id)}
                                  disabled={savingMemoUserId === user.id}
                                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-neutral-50 disabled:opacity-50"
                                >
                                  <X className="h-3 w-3" />
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <p className="flex-1 text-sm text-slate-600 whitespace-pre-wrap min-h-[3rem]">
                                {user.memo || <span className="text-slate-400">메모가 없습니다.</span>}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleStartEditMemo(user.id, user.memo)}
                                className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-neutral-50 flex-shrink-0"
                              >
                                <Edit2 className="h-3 w-3" />
                                {user.memo ? "수정" : "추가"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                      {user.lastLoginAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          최근 로그인: {new Date(user.lastLoginAt).toLocaleDateString("ko-KR")}
                        </span>
                      )}
                    </div>
                  </div>

                  {user.status === "PENDING" && (
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(user.id)}
                        disabled={updatingUserId === user.id}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        <UserCheck className="h-4 w-4" />
                        {updatingUserId === user.id ? "처리 중..." : "승인"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(user.id)}
                        disabled={updatingUserId === user.id}
                        className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <UserX className="h-4 w-4" />
                        거부
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
