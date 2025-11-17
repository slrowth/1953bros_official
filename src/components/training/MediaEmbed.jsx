"use client";

import { useEffect, useRef } from "react";

export default function MediaEmbed({ mediaType, mediaUrl }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!mediaUrl || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    if (mediaType === "NOTION") {
      // 노션은 iframe 임베드가 차단되므로 새 창에서 열기 링크 제공
      container.innerHTML = `
        <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
          <div class="mb-4">
            <svg class="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <p class="text-slate-600 mb-2 font-medium">노션 페이지</p>
          <p class="text-sm text-slate-500 mb-4">노션 페이지는 새 창에서 열어야 합니다.</p>
          <a 
            href="${mediaUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#7a6548]"
          >
            노션 페이지 열기
          </a>
        </div>
      `;
    } else if (mediaType === "YOUTUBE") {
      // 유튜브 임베드
      let videoId = "";
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = mediaUrl.match(youtubeRegex);
      if (match) {
        videoId = match[1];
      }

      if (videoId) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.style.width = "100%";
        iframe.style.aspectRatio = "16/9";
        iframe.style.border = "none";
        iframe.allowFullscreen = true;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        container.appendChild(iframe);
      } else {
        container.innerHTML = `<p class="text-slate-500">유효하지 않은 유튜브 URL입니다.</p>`;
      }
    } else if (mediaType === "VIDEO") {
      // 동영상 임베드
      const video = document.createElement("video");
      video.src = mediaUrl;
      video.controls = true;
      video.style.width = "100%";
      video.style.maxHeight = "600px";
      container.appendChild(video);
    } else if (mediaType === "PDF") {
      // PDF 임베드
      const iframe = document.createElement("iframe");
      iframe.src = mediaUrl;
      iframe.style.width = "100%";
      iframe.style.height = "800px";
      iframe.style.border = "none";
      container.appendChild(iframe);
    } else if (mediaType === "IMAGE") {
      // 이미지 표시
      const img = document.createElement("img");
      img.src = mediaUrl;
      img.alt = "교육 자료 이미지";
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.borderRadius = "0.5rem";
      container.appendChild(img);
    } else if (mediaType === "FILE") {
      // 파일 타입에 따라 적절히 표시
      // URL에서 쿼리 파라미터나 해시 제거 후 확장자 추출
      const cleanUrl = mediaUrl.split("?")[0].split("#")[0];
      const fileExt = cleanUrl.split(".").pop()?.toLowerCase();
      const isPdf = fileExt === "pdf";
      const isVideo = ["mp4", "mov", "avi", "webm", "mpeg", "m4v"].includes(fileExt);
      const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(fileExt);

      // 에러 처리 추가
      const handleError = (element, errorMessage) => {
        element.onerror = () => {
          container.innerHTML = `
            <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p class="text-red-600 mb-2 font-medium">파일을 불러올 수 없습니다</p>
              <p class="text-sm text-red-500 mb-4">${errorMessage || "파일 URL이 유효하지 않거나 접근할 수 없습니다."}</p>
              <a 
                href="${mediaUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
              >
                직접 열기
              </a>
            </div>
          `;
        };
      };

      if (isPdf) {
        // PDF 임베드
        const iframe = document.createElement("iframe");
        iframe.src = mediaUrl;
        iframe.style.width = "100%";
        iframe.style.height = "800px";
        iframe.style.border = "none";
        handleError(iframe, "PDF 파일을 불러올 수 없습니다.");
        container.appendChild(iframe);
      } else if (isVideo) {
        // 동영상 임베드
        const video = document.createElement("video");
        video.src = mediaUrl;
        video.controls = true;
        video.style.width = "100%";
        video.style.maxHeight = "600px";
        handleError(video, "동영상 파일을 불러올 수 없습니다.");
        container.appendChild(video);
      } else if (isImage) {
        // 이미지 표시
        const img = document.createElement("img");
        img.src = mediaUrl;
        img.alt = "교육 자료 이미지";
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.borderRadius = "0.5rem";
        handleError(img, "이미지 파일을 불러올 수 없습니다.");
        container.appendChild(img);
      } else {
        // 기타 파일은 다운로드 링크
        container.innerHTML = `
          <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
            <p class="text-slate-600 mb-4">파일을 다운로드하거나 새 창에서 열 수 있습니다.</p>
            <a 
              href="${mediaUrl}" 
              target="_blank" 
              rel="noopener noreferrer"
              download
              class="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
            >
              파일 열기
            </a>
          </div>
        `;
      }
    } else if (mediaType === "LINK" || mediaType === "DOCUMENT") {
      // 링크, 문서는 새 창에서 열기
      container.innerHTML = `
        <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
          <p class="text-slate-600 mb-4">외부 링크로 이동합니다.</p>
          <a 
            href="${mediaUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg bg-[#967d5a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#7a6548]"
          >
            링크 열기
          </a>
        </div>
      `;
    }
  }, [mediaType, mediaUrl]);

  return <div ref={containerRef} className="w-full"></div>;
}

