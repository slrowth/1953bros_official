"use client";

import { useState, useRef } from "react";
import { Upload, X, File, Loader2 } from "lucide-react";

export default function FileUpload({ onUploadComplete, onRemove, existingUrl, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    setError(null);
    setUploading(true);

    try {
      // 파일 크기 제한 (100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("파일 크기는 100MB를 초과할 수 없습니다.");
      }

      // FormData 생성
      const formData = new FormData();
      formData.append("file", file);

      // 업로드 API 호출
      const response = await fetch("/api/training-materials/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "파일 업로드에 실패했습니다.");
      }

      if (onUploadComplete) {
        onUploadComplete(data.url, file.name, file.type);
      }
    } catch (err) {
      console.error("File upload error:", err);
      setError(err.message || "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (existingUrl) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">파일이 업로드되었습니다</p>
              <p className="text-xs text-green-600 truncate max-w-xs">{existingUrl}</p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg p-1 text-green-600 transition hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition
          ${
            isDragging
              ? "border-[#967d5a] bg-[#967d5a]/10"
              : disabled
              ? "border-neutral-200 bg-neutral-50 cursor-not-allowed"
              : "border-neutral-300 bg-white hover:border-[#967d5a] hover:bg-[#967d5a]/5"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov,.avi,.jpg,.jpeg,.png,.gif,.webp"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#967d5a]" />
            <p className="text-sm font-medium text-slate-700">업로드 중...</p>
            <p className="text-xs text-slate-500">잠시만 기다려주세요</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="mt-1 text-xs text-slate-500">
                PDF, 문서, 동영상, 이미지 파일 (최대 100MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}

