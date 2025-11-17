"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, FileText, Video, Link as LinkIcon, Image, File, BookOpen, Plus, Edit2, Trash2, MessageSquare, X } from "lucide-react";
import MediaEmbed from "@/components/training/MediaEmbed";
import InquiryPanel from "@/components/training/InquiryPanel";
import FileUpload from "@/components/training/FileUpload";

// URL형 미디어 타입
const URL_MEDIA_TYPES = [
  { value: "NOTION", label: "노션", icon: BookOpen, description: "노션 페이지 링크를 입력하세요", inputType: "url" },
  { value: "YOUTUBE", label: "유튜브", icon: Video, description: "유튜브 영상 URL을 입력하세요", inputType: "url" },
  { value: "LINK", label: "링크", icon: LinkIcon, description: "웹사이트 URL을 입력하세요", inputType: "url" },
];

// 파일 업로드형 미디어 타입
const FILE_MEDIA_TYPES = [
  { value: "FILE", label: "파일", icon: File, description: "PDF, 문서, 동영상, 이미지 파일을 업로드하세요", inputType: "file" },
];

const ALL_MEDIA_TYPES = [...URL_MEDIA_TYPES, ...FILE_MEDIA_TYPES];

const CATEGORY_OPTIONS = [
  "운영 매뉴얼",
  "제품 정보",
  "서비스 가이드",
  "안전 관리",
  "기타",
];

export default function TrainingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view");
  const materialId = searchParams.get("id");
  const isCreateMode = viewMode === "create";
  const isEditMode = !!materialId && viewMode !== "view" && !isCreateMode;
  const isViewMode = viewMode === "view" && !!materialId;

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    mediaItems: [],
    isPublished: false,
  });
  const [showFileUpload, setShowFileUpload] = useState({});
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [selectedUrlMediaType, setSelectedUrlMediaType] = useState("NOTION");
  const [urlInput, setUrlInput] = useState("");

  const DRAFT_STORAGE_KEY = "training-material-draft";

  // 임시저장 데이터 불러오기
  const loadDraft = () => {
    if (typeof window === "undefined") return null;
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error("Failed to load draft:", error);
      return null;
    }
  };

  // 임시저장 데이터 저장
  const saveDraft = () => {
    if (typeof window === "undefined") return;
    try {
      // 등록 모드일 때만 임시저장
      if (isCreateMode && !isEditMode) {
        const draftData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          mediaItems: formData.mediaItems,
          isPublished: formData.isPublished,
          urlInput: urlInput,
          selectedUrlMediaType: selectedUrlMediaType,
          showFileUpload: showFileUpload,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  // 임시저장 데이터 삭제
  const clearDraft = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  };

  // 임시저장 데이터 복원
  const restoreDraft = (draft) => {
    if (!draft) return;
    setFormData({
      title: draft.title || "",
      description: draft.description || "",
      category: draft.category || "",
      mediaItems: draft.mediaItems || [],
      isPublished: draft.isPublished || false,
    });
    setUrlInput(draft.urlInput || "");
    setSelectedUrlMediaType(draft.selectedUrlMediaType || "NOTION");
    setShowFileUpload(draft.showFileUpload || {});
  };

  useEffect(() => {
    fetchMaterials();
    if ((isViewMode || isEditMode) && materialId) {
      fetchMaterial();
    }
    // 등록 모드 진입 시 임시저장 데이터 확인
    if (isCreateMode && !isEditMode) {
      // 폼 초기화
      setFormData({
        title: "",
        description: "",
        category: "",
        mediaItems: [],
        isPublished: false,
      });
      setUrlInput("");
      setSelectedUrlMediaType("NOTION");
      setShowFileUpload({});
      
      const draft = loadDraft();
      if (draft && (draft.title || draft.description || draft.mediaItems?.length > 0)) {
        setShowDraftDialog(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId, isViewMode, isEditMode, isCreateMode]);

  // formData 변경 시 자동 임시저장
  useEffect(() => {
    if (isCreateMode && !isEditMode) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 1000); // 1초 디바운스
      return () => clearTimeout(timer);
    }
  }, [formData, urlInput, selectedUrlMediaType, showFileUpload, isCreateMode, isEditMode]);

  // 페이지 이탈 시 임시저장
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isCreateMode && !isEditMode) {
        saveDraft();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formData, urlInput, selectedUrlMediaType, showFileUpload, isCreateMode, isEditMode]);

  // 링크만 있는 경우 자동 리다이렉트
  useEffect(() => {
    if (isViewMode && selectedMaterial) {
      const mediaItems = Array.isArray(selectedMaterial.mediaItems) ? selectedMaterial.mediaItems : [];
      const linkMediaTypes = ["NOTION", "YOUTUBE", "LINK"];
      const hasDescription = selectedMaterial.description && selectedMaterial.description.trim() !== "";
      const hasLinkOnly = !hasDescription && mediaItems.length > 0 && mediaItems.every((item) => linkMediaTypes.includes(item.mediaType));
      const linkItems = mediaItems.filter((item) => linkMediaTypes.includes(item.mediaType));

      if (hasLinkOnly && linkItems.length > 0) {
        window.open(linkItems[0].mediaUrl, "_blank", "noopener,noreferrer");
        router.push("/admin/training/new");
      }
    }
  }, [isViewMode, selectedMaterial, router]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/training-materials");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "교육 자료 목록을 불러오는데 실패했습니다.");
      }

      setMaterials(data.materials || []);
    } catch (error) {
      console.error("Fetch materials error:", error);
      alert(error.message || "교육 자료 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterial = async () => {
    if (!materialId) return;
    try {
      setFetching(true);
      const response = await fetch(`/api/training-materials/${materialId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "교육 자료를 불러오는데 실패했습니다.");
      }

      const material = data.material;
      setSelectedMaterial(material);
      setFormData({
        title: material.title || "",
        description: material.description || "",
        category: material.category || "",
        mediaItems: material.mediaItems && Array.isArray(material.mediaItems) && material.mediaItems.length > 0
          ? material.mediaItems.map((item, index) => ({
              mediaType: item.mediaType || "NOTION",
              mediaUrl: item.mediaUrl || "",
              displayOrder: item.displayOrder !== undefined ? item.displayOrder : index,
            }))
          : [],
        isPublished: material.isPublished || false,
      });
    } catch (error) {
      console.error("Fetch material error:", error);
      alert(error.message || "교육 자료를 불러오는 중 오류가 발생했습니다.");
      router.push("/admin/training/new");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 미디어 항목 검증
      const validMediaItems = formData.mediaItems.filter((item) => item.mediaUrl && item.mediaUrl.trim() !== "");
      if (validMediaItems.length === 0) {
        alert("최소 하나의 미디어를 등록해주세요.");
        setSaving(false);
        return;
      }

      const url = isEditMode ? `/api/training-materials/${materialId}` : "/api/training-materials";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          mediaItems: validMediaItems,
          isPublished: formData.isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isEditMode ? "교육 자료 수정에 실패했습니다." : "교육 자료 등록에 실패했습니다."));
      }

      // 등록 성공 시 임시저장 데이터 삭제
      if (!isEditMode) {
        clearDraft();
      }

      alert(isEditMode ? "교육 자료가 수정되었습니다." : "교육 자료가 등록되었습니다.");
      await fetchMaterials();
      router.push("/admin/training/new");
    } catch (error) {
      console.error(isEditMode ? "Update material error:" : "Create material error:", error);
      alert(error.message || (isEditMode ? "교육 자료 수정에 실패했습니다." : "교육 자료 등록에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`"${title}" 교육 자료를 삭제하시겠습니까?\n삭제된 교육 자료는 복구할 수 없습니다.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/training-materials/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "교육 자료 삭제에 실패했습니다.");
      }

      alert("교육 자료가 삭제되었습니다.");
      await fetchMaterials();
      if (selectedMaterial?.id === id) {
        router.push("/admin/training/new");
      }
    } catch (error) {
      console.error("Delete material error:", error);
      alert(error.message || "교육 자료 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddMedia = () => {
    setFormData((prev) => ({
      ...prev,
      mediaItems: [
        ...prev.mediaItems,
        {
          mediaType: "FILE",
          mediaUrl: "",
          displayOrder: prev.mediaItems.length,
        },
      ],
    }));
  };

  const handleRemoveMedia = (index) => {
    setFormData((prev) => ({
      ...prev,
      mediaItems: prev.mediaItems.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        displayOrder: i,
      })),
    }));
  };

  const handleMediaChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      mediaItems: prev.mediaItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleMoveMedia = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.mediaItems.length - 1)
    ) {
      return;
    }
    setFormData((prev) => {
      const newItems = [...prev.mediaItems];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      return {
        ...prev,
        mediaItems: newItems.map((item, i) => ({ ...item, displayOrder: i })),
      };
    });
  };

  const getMediaTypeIcon = (mediaType) => {
    const option = ALL_MEDIA_TYPES.find((opt) => opt.value === mediaType);
    return option ? option.icon : File;
  };

  const getMediaTypeOption = (mediaType) => {
    return ALL_MEDIA_TYPES.find((opt) => opt.value === mediaType);
  };

  const handleFileUploadComplete = (url, fileName, fileType) => {
    // 새로운 미디어 항목 추가
    setFormData((prev) => ({
      ...prev,
      mediaItems: [
        ...prev.mediaItems,
        {
          mediaType: "FILE",
          mediaUrl: url,
          displayOrder: prev.mediaItems.length,
        },
      ],
    }));
    setShowFileUpload({});
  };

  const handleFileRemove = (index) => {
    handleRemoveMedia(index);
  };

  const handleUrlRegister = () => {
    const url = urlInput?.trim();
    if (!url) {
      alert("URL을 입력해주세요.");
      return;
    }

    // 새로운 미디어 항목 추가
    setFormData((prev) => ({
      ...prev,
      mediaItems: [
        ...prev.mediaItems,
        {
          mediaType: selectedUrlMediaType,
          mediaUrl: url,
          displayOrder: prev.mediaItems.length,
        },
      ],
    }));

    // URL 입력 초기화
    setUrlInput("");
  };

  const handleShowFileUpload = () => {
    setShowFileUpload({ show: true });
  };

  const handleHideFileUpload = () => {
    setShowFileUpload({});
  };

  const getMediaTypeLabel = (mediaType) => {
    const option = ALL_MEDIA_TYPES.find((opt) => opt.value === mediaType);
    return option ? option.label : mediaType;
  };

  // 목록 보기
  if (!isViewMode && !isEditMode && !isCreateMode) {
    return (
      <div className="flex flex-1 flex-col bg-neutral-50">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">교육 자료 관리</h1>
              <p className="mt-1 text-sm text-slate-500">교육 자료를 등록하고 관리할 수 있습니다.</p>
            </div>
            <button
              onClick={() => {
                const draft = loadDraft();
                if (draft && (draft.title || draft.description || draft.mediaItems?.length > 0)) {
                  if (confirm("이전에 작성하던 내용이 있습니다. 불러오시겠습니까?\n\n'확인'을 누르면 이전 내용을 불러오고,\n'취소'를 누르면 새로 작성합니다.")) {
                    router.push("/admin/training/new?view=create");
                    // 페이지 이동 후 복원은 useEffect에서 처리
                  } else {
                    clearDraft();
                    router.push("/admin/training/new?view=create");
                  }
                } else {
                  router.push("/admin/training/new?view=create");
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
            >
              <Plus className="h-4 w-4" />
              교육 자료 등록
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
                <p className="mt-4 text-sm text-slate-500">교육 자료를 불러오는 중...</p>
              </div>
            </div>
          ) : materials.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
              <p className="text-slate-500">등록된 교육 자료가 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => {
                const mediaItems = Array.isArray(material.mediaItems) ? material.mediaItems : [];
                const linkMediaTypes = ["NOTION", "YOUTUBE", "LINK"];
                const fileMediaTypes = ["FILE", "PDF", "DOCUMENT", "VIDEO", "IMAGE"];
                
                // 자료 타입 판단
                const hasDescription = material.description && material.description.trim() !== "";
                const hasLinkOnly = !hasDescription && mediaItems.length > 0 && mediaItems.every((item) => linkMediaTypes.includes(item.mediaType));
                const hasFileAttachments = mediaItems.some((item) => fileMediaTypes.includes(item.mediaType));
                
                const firstMediaType = mediaItems.length > 0 
                  ? mediaItems[0].mediaType 
                  : (material.mediaType || "FILE");
                const Icon = getMediaTypeIcon(firstMediaType);

                return (
                  <div
                    key={material.id}
                    className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md cursor-pointer"
                    onClick={() => {
                      // 링크만 있는 경우 바로 이동
                      if (hasLinkOnly && mediaItems.length > 0) {
                        window.open(mediaItems[0].mediaUrl, "_blank", "noopener,noreferrer");
                      } else {
                        // 텍스트 기반이거나 첨부파일이 있는 경우 상세 페이지로
                        router.push(`/admin/training/new?id=${material.id}&view=view`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="rounded-lg bg-[#967d5a]/10 p-2">
                          <Icon className="h-5 w-5 text-[#967d5a]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 hover:text-[#967d5a] transition">
                            {material.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">{material.category}</p>
                        </div>
                      </div>
                    </div>
                    {hasDescription && (
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                        {material.description}
                      </p>
                    )}
                    <div className="mt-4 space-y-2">
                      {/* 자료 타입 배지 */}
                      <div className="flex flex-wrap items-center gap-2">
                        {hasDescription ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                            매뉴얼
                          </span>
                        ) : hasLinkOnly ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            링크
                          </span>
                        ) : null}
                        
                        {hasFileAttachments && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                            <File className="h-3 w-3" />
                            첨부파일 있음
                          </span>
                        )}
                      </div>
                      
                      {/* 발행 상태 */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-400">
                          {hasLinkOnly ? "클릭 시 바로 이동" : "클릭 시 상세보기"}
                        </span>
                        {material.isPublished ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            발행됨
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                            미발행
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 상세 보기
  if (isViewMode && selectedMaterial) {
    const mediaItems = Array.isArray(selectedMaterial.mediaItems) ? selectedMaterial.mediaItems : [];
    const linkMediaTypes = ["NOTION", "YOUTUBE", "LINK"];
    const fileMediaTypes = ["FILE", "PDF", "DOCUMENT", "VIDEO", "IMAGE"];
    
    // 자료 타입 판단
    const hasDescription = selectedMaterial.description && selectedMaterial.description.trim() !== "";
    const hasLinkOnly = !hasDescription && mediaItems.length > 0 && mediaItems.every((item) => linkMediaTypes.includes(item.mediaType));
    const fileAttachments = mediaItems.filter((item) => fileMediaTypes.includes(item.mediaType));
    const linkItems = mediaItems.filter((item) => linkMediaTypes.includes(item.mediaType));

    // 링크만 있는 경우 로딩 화면 표시
    if (hasLinkOnly) {
      return (
        <div className="flex flex-1 flex-col bg-neutral-50">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
              <p className="mt-4 text-sm text-slate-500">링크로 이동 중...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col bg-neutral-50">
        <div className="flex flex-1">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
              <div className="flex items-center justify-between">
                <Link
                  href="/admin/training/new"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  목록으로
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/training/new?id=${materialId}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    수정
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(materialId, selectedMaterial.title)}
                    disabled={deletingId === materialId}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === materialId ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-sm">
                <h1 className="mb-4 text-3xl font-bold text-slate-900">{selectedMaterial.title}</h1>
                {selectedMaterial.description && (
                  <div className="mb-6">
                    <div className="prose max-w-none text-slate-600 whitespace-pre-wrap">
                      {selectedMaterial.description}
                    </div>
                  </div>
                )}
                <div className="mb-6 flex items-center gap-4">
                  <span className="rounded-full bg-[#967d5a]/10 px-3 py-1 text-sm font-medium text-[#967d5a]">
                    {selectedMaterial.category}
                  </span>
                  {fileAttachments.length > 0 && (
                    <span className="text-sm text-slate-500">
                      첨부파일 {fileAttachments.length}개
                    </span>
                  )}
                </div>
                
                {/* 첨부파일 목록 */}
                {fileAttachments.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">첨부파일</h3>
                    <div className="space-y-2">
                      {fileAttachments.map((fileItem, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <File className="h-5 w-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {getMediaTypeLabel(fileItem.mediaType)} 파일
                              </p>
                              <p className="text-xs text-slate-500 truncate max-w-md">
                                {fileItem.mediaUrl}
                              </p>
                            </div>
                          </div>
                          <a
                            href={fileItem.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
                          >
                            <File className="h-4 w-4" />
                            다운로드
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 미디어 표시 (링크가 있는 경우) */}
                {linkItems.length > 0 && (
                  <div className="space-y-6">
                    {linkItems.map((mediaItem, index) => (
                      <div key={index} className="rounded-lg border border-neutral-200 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            {getMediaTypeLabel(mediaItem.mediaType)}
                          </span>
                        </div>
                        <MediaEmbed mediaType={mediaItem.mediaType} mediaUrl={mediaItem.mediaUrl} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 문의하기 패널 (고정) */}
          <InquiryPanel
            trainingMaterialId={materialId}
            isOpen={isInquiryOpen}
            onClose={() => setIsInquiryOpen(false)}
          />
        </div>

        {/* 문의하기 버튼 (고정) */}
        <button
          type="button"
          onClick={() => setIsInquiryOpen(!isInquiryOpen)}
          className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#967d5a] px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#7a6548]"
        >
          <MessageSquare className="h-5 w-5" />
          문의하기
        </button>
      </div>
    );
  }

  // 등록/수정 폼
  if (isCreateMode || isEditMode) {
    return (
      <div className="flex flex-1 flex-col bg-neutral-50">
        {/* 임시저장 복원 다이얼로그 */}
        {showDraftDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-2xl bg-white p-6 shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">임시저장된 내용이 있습니다</h3>
              <p className="text-sm text-slate-600 mb-6">
                이전에 작성하던 내용을 불러오시겠습니까?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const draft = loadDraft();
                    if (draft) {
                      restoreDraft(draft);
                    }
                    setShowDraftDialog(false);
                  }}
                  className="flex-1 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
                >
                  불러오기
                </button>
                <button
                  onClick={() => {
                    clearDraft();
                    // 폼 초기화
                    setFormData({
                      title: "",
                      description: "",
                      category: "",
                      mediaItems: [],
                      isPublished: false,
                    });
                    setUrlInput("");
                    setSelectedUrlMediaType("NOTION");
                    setShowFileUpload({});
                    setShowDraftDialog(false);
                  }}
                  className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-neutral-50"
                >
                  새로 작성
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
          <div className="flex items-center justify-between">
            <Link
              href="/admin/training/new"
              onClick={() => {
                // 목록으로 돌아갈 때 임시저장
                if (isCreateMode && !isEditMode) {
                  saveDraft();
                }
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
            >
              <ArrowLeft className="h-4 w-4" />
              목록으로
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-slate-900">
                {isEditMode ? "교육 자료 수정" : "교육 자료 등록"}
              </h1>
              {isCreateMode && !isEditMode && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="text-xs text-slate-500 hover:text-slate-700 transition"
                  title="임시저장 삭제"
                >
                  임시저장 삭제
                </button>
              )}
            </div>

            {fetching && (
              <div className="mb-6 flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#967d5a] mx-auto"></div>
                  <p className="mt-4 text-sm text-slate-500">교육 자료를 불러오는 중...</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" style={{ display: fetching ? "none" : "block" }}>
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-700">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  placeholder="교육 자료 제목을 입력하세요"
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
                  rows={4}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                  placeholder="교육 자료 설명을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                >
                  <option value="">카테고리를 선택하세요</option>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-4 block text-sm font-semibold text-slate-700">
                  미디어 <span className="text-red-500">*</span>
                </label>

                {/* URL 입력 섹션 */}
                <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="mb-3 text-sm font-medium text-slate-700">URL 입력</p>
                  <div className="space-y-4">
                    {/* 노션, 유튜브, 기타링크 버튼 */}
                    <div className="grid grid-cols-3 gap-2">
                      {URL_MEDIA_TYPES.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedUrlMediaType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setSelectedUrlMediaType(option.value)}
                            className={`flex w-full flex-col items-center gap-1 rounded-lg border-2 p-2 transition ${
                              isSelected
                                ? "border-[#967d5a] bg-[#967d5a]/10"
                                : "border-neutral-200 bg-white hover:border-[#967d5a]/50"
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${isSelected ? "text-[#967d5a]" : "text-slate-400"}`} />
                            <span className={`text-xs font-medium ${isSelected ? "text-[#967d5a]" : "text-slate-600"}`}>
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* URL 입력 칸과 등록 버튼 */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = getMediaTypeIcon(selectedUrlMediaType);
                        return <Icon className="h-4 w-4 text-slate-400" />;
                      })()}
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-slate-900 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
                        placeholder={
                          selectedUrlMediaType === "NOTION"
                            ? "https://www.notion.so/..."
                            : selectedUrlMediaType === "YOUTUBE"
                            ? "https://www.youtube.com/watch?v=..."
                            : "https://..."
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleUrlRegister();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleUrlRegister}
                        disabled={!urlInput?.trim()}
                        className="rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>

                {/* 파일 업로드 섹션 */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="mb-3 text-sm font-medium text-slate-700">파일 업로드</p>
                  {!showFileUpload.show ? (
                    <button
                      type="button"
                      onClick={handleShowFileUpload}
                      className="flex w-full items-center gap-2 rounded-lg border-2 border-neutral-200 bg-white p-3 transition hover:border-[#967d5a]/50"
                    >
                      <File className="h-5 w-5 text-slate-400" />
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-slate-600">파일</span>
                        <p className="text-xs text-slate-500">PDF, 문서, 동영상, 이미지</p>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">파일 업로드</p>
                        <button
                          type="button"
                          onClick={handleHideFileUpload}
                          className="rounded-lg p-1 text-slate-400 transition hover:bg-neutral-100 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <FileUpload
                        onUploadComplete={handleFileUploadComplete}
                        onRemove={handleHideFileUpload}
                        existingUrl={null}
                        disabled={saving || fetching}
                      />
                    </div>
                  )}
                </div>

                {/* 등록된 미디어 목록 */}
                {formData.mediaItems.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-medium text-slate-700">등록된 미디어 ({formData.mediaItems.length}개)</p>
                    {formData.mediaItems.map((mediaItem, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          {(() => {
                            const Icon = getMediaTypeIcon(mediaItem.mediaType);
                            return (
                              <div className="rounded-lg bg-[#967d5a]/10 p-2">
                                <Icon className="h-4 w-4 text-[#967d5a]" />
                              </div>
                            );
                          })()}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700">
                              {getMediaTypeLabel(mediaItem.mediaType)}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-md">{mediaItem.mediaUrl}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveMedia(index, "up")}
                            disabled={index === 0}
                            className="rounded-lg border border-neutral-200 bg-white p-1.5 text-slate-600 transition hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="위로 이동"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveMedia(index, "down")}
                            disabled={index === formData.mediaItems.length - 1}
                            className="rounded-lg border border-neutral-200 bg-white p-1.5 text-slate-600 transition hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="아래로 이동"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(index)}
                            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-neutral-300 text-[#967d5a] focus:ring-[#967d5a]"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-slate-700">
                  발행하기 (체크하면 사용자에게 공개됩니다)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Link
                  href="/admin/training/new"
                  onClick={() => {
                    // 취소 시 임시저장
                    if (isCreateMode && !isEditMode) {
                      saveDraft();
                    }
                  }}
                  className="rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-neutral-50"
                >
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={saving || fetching}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#967d5a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7a6548] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? (isEditMode ? "수정 중..." : "등록 중...") : (isEditMode ? "수정" : "등록")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
