"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, Video, Link as LinkIcon, Image, File, MessageSquare, Search } from "lucide-react";
import MediaEmbed from "@/components/training/MediaEmbed";
import InquiryPanel from "@/components/training/InquiryPanel";

const MEDIA_TYPE_ICONS = {
  NOTION: BookOpen,
  YOUTUBE: Video,
  VIDEO: Video,
  PDF: FileText,
  DOCUMENT: FileText,
  IMAGE: Image,
  LINK: LinkIcon,
  FILE: File,
};

const MEDIA_TYPE_LABELS = {
  NOTION: "노션",
  YOUTUBE: "유튜브",
  VIDEO: "동영상",
  PDF: "PDF",
  DOCUMENT: "문서",
  IMAGE: "이미지",
  LINK: "링크",
  FILE: "파일",
};

const CATEGORY_OPTIONS = [
  "전체",
  "운영 매뉴얼",
  "제품 정보",
  "서비스 가이드",
  "안전 관리",
  "기타",
];

export default function TrainingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get("id");
  const isViewMode = !!materialId;

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetching, setFetching] = useState(false);
  const [isInquiryOpenList, setIsInquiryOpenList] = useState(false);

  useEffect(() => {
    fetchMaterials();
    if (isViewMode && materialId) {
      fetchMaterial();
    }
  }, [materialId, isViewMode]);

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
        router.push("/training");
      }
    }
  }, [isViewMode, selectedMaterial, router]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/training-materials?isPublished=true");
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

      setSelectedMaterial(data.material);
    } catch (error) {
      console.error("Fetch material error:", error);
      alert(error.message || "교육 자료를 불러오는 중 오류가 발생했습니다.");
      router.push("/training");
    } finally {
      setFetching(false);
    }
  };

  const getMediaTypeIcon = (mediaType) => {
    return MEDIA_TYPE_ICONS[mediaType] || FileText;
  };

  const getMediaTypeLabel = (mediaType) => {
    return MEDIA_TYPE_LABELS[mediaType] || mediaType;
  };

  // 필터링된 교육 자료
  const filteredMaterials = materials.filter((material) => {
    const matchesCategory = selectedCategory === "전체" || material.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 목록 보기
  if (!isViewMode) {
    return (
      <div className="flex flex-1 flex-col bg-neutral-50">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">교육 자료</h1>
              <p className="mt-1 text-sm text-slate-500">교육 자료를 확인하고 학습할 수 있습니다.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsInquiryOpenList(!isInquiryOpenList)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
            >
              <MessageSquare className="h-4 w-4" />
              문의하기
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="교육 자료 검색..."
                className="w-full rounded-xl border border-neutral-300 bg-white px-10 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#967d5a] focus:outline-none focus:ring-2 focus:ring-[#967d5a]/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === category
                      ? "bg-[#967d5a] text-white"
                      : "bg-white text-slate-700 border border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
                <p className="mt-4 text-sm text-slate-500">교육 자료를 불러오는 중...</p>
              </div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-slate-500">
                {searchQuery || selectedCategory !== "전체"
                  ? "검색 결과가 없습니다."
                  : "등록된 교육 자료가 없습니다."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => {
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
                        router.push(`/training?id=${material.id}`);
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
                      
                      {/* 날짜 */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-400">
                          {hasLinkOnly ? "클릭 시 바로 이동" : "클릭 시 상세보기"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(material.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 문의하기 패널 (목록 화면) */}
        <InquiryPanel
          trainingMaterialId={null}
          isOpen={isInquiryOpenList}
          onClose={() => setIsInquiryOpenList(false)}
        />
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
                  href="/training"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#967d5a]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  목록으로
                </Link>
              </div>

              {fetching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#967d5a] mx-auto"></div>
                    <p className="mt-4 text-sm text-slate-500">교육 자료를 불러오는 중...</p>
                  </div>
                </div>
              ) : (
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
                    <span className="text-sm text-slate-400">
                      {new Date(selectedMaterial.createdAt).toLocaleDateString("ko-KR")}
                    </span>
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
              )}
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

  return null;
}

