import { NextRequest, NextResponse } from "next/server";
import {
  StorageConfigError,
  removeAttachment,
  uploadAttachmentFromFile,
} from "@/lib/storage";

const MAX_ATTACHMENT_BYTES =
  Number(process.env.NOTE_ATTACHMENT_MAX_BYTES ?? 2_000_000) || 2_000_000;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data request." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Include the file in the `file` field." },
        { status: 400 }
      );
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        {
          error: `Attachment exceeds ${(MAX_ATTACHMENT_BYTES / 1_000_000).toFixed(1)} MB limit.`,
        },
        { status: 413 }
      );
    }

    const uploaded = await uploadAttachmentFromFile(file);

    return NextResponse.json({
      ok: true,
      path: uploaded.path,
      url: uploaded.url,
    });
  } catch (error) {
    console.error("[notes.attachments] upload failed", error);
    if (error instanceof StorageConfigError) {
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to store attachment. Try again shortly." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await req.json();
    const path = typeof payload?.path === "string" ? payload.path : null;

    if (!path) {
      return NextResponse.json(
        { error: "Provide a valid attachment path to delete." },
        { status: 400 }
      );
    }

    await removeAttachment(path);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[notes.attachments] delete failed", error);
    if (error instanceof StorageConfigError) {
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete attachment." },
      { status: 500 }
    );
  }
}
