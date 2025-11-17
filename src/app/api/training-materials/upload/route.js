import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 교육 자료 미디어 파일 업로드 API
 * POST /api/training-materials/upload
 * ADMIN만 접근 가능
 */
export async function POST(request) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 100MB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // 허용된 파일 타입
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "지원하지 않는 파일 형식입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 파일명 생성 (타임스탬프 + 랜덤 문자열 + 원본 파일명)
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}-${sanitizedFileName}`;
    const filePath = fileName;

    // Supabase Storage에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("1953bros")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("File upload error:", uploadError);
      
      // 버킷이 없는 경우 안내 메시지
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        return NextResponse.json(
          { 
            error: "Storage 버킷이 설정되지 않았습니다. 관리자에게 문의하세요.\nSupabase 대시보드에서 '1953bros' 버킷을 생성해주세요." 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: uploadError.message || "파일 업로드 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from("1953bros")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

