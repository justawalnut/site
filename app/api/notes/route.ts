import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  StorageConfigError,
  uploadAttachmentFromDataUrl,
} from "@/lib/storage";

const TAG_OPTIONS = ["daily-rhythm", "strategy-threads", "trade-notes", "infra"] as const;

const attachmentPayloadSchema = z
  .union([
    z
      .object({
        path: z.string().min(1, "Attachment path missing"),
        url: z.string().url("Attachment URL must be valid"),
      })
      .strict(),
    z
      .string()
      .trim()
      .max(2_000_000, "Attachment is too large")
      .refine(
        (value) =>
          value.startsWith("data:image/") ||
          value.startsWith("http://") ||
          value.startsWith("https://"),
        "Provide an image URL or data URL"
      ),
    z.null(),
  ])
  .optional();

const payloadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  content: z.string().min(1, "Add at least one character"),
  tag: z.enum(TAG_OPTIONS).optional(),
  parentId: z.number().int().positive().optional(),
  attachment: attachmentPayloadSchema,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = payloadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { name, content, parentId, tag, attachment } = parsed.data;
    const displayName = name.trim();

    if (!parentId && !tag) {
      return NextResponse.json(
        { error: "Select a tag for this note." },
        { status: 422 }
      );
    }

    let author = await prisma.user.findFirst({
      where: {
        displayName,
      },
    });

    if (!author) {
      const slug = slugify(displayName) || "guest";
      const email = `guest+${slug}-${randomUUID().slice(0, 8)}@desk.local`;

      author = await prisma.user.create({
        data: {
          email,
          displayName,
        },
      });
    }

    if (!author) {
      return NextResponse.json(
        { error: "Unable to resolve author" },
        { status: 500 }
      );
    }

    let noteScope: "day" | "strategy" | "trade";
    let noteScopeRef: string;
    let noteStrategyId: string | undefined;
    let noteTag: (typeof TAG_OPTIONS)[number] = tag ?? "daily-rhythm";
    let parentNoteId: number | undefined;

    if (parentId) {
      const parentNote = await prisma.note.findUnique({
        where: { id: parentId },
      });

      if (!parentNote) {
        return NextResponse.json(
          { error: "Parent note not found" },
          { status: 404 }
        );
      }

      parentNoteId = parentNote.id;
      noteScope = parentNote.scope as "day" | "strategy" | "trade";
      noteScopeRef = parentNote.scopeRef;
      noteStrategyId = parentNote.strategyId ?? undefined;
      const parentTag =
        parentNote.tag === "infraa" ? "infra" : parentNote.tag;
      noteTag = (parentTag ?? noteTag) as typeof noteTag;
    } else {
      const derived = deriveScopeFromTag(noteTag);
      noteScope = derived.scope;
      noteScopeRef = derived.scopeRef;
      noteStrategyId = undefined;
    }

    let attachmentResult:
      | { url?: string; path?: string }
      | undefined;
    try {
      attachmentResult = await resolveAttachment(attachment);
    } catch (error) {
      if (error instanceof StorageConfigError) {
        return NextResponse.json(
          { error: error.message },
          { status: 503 }
        );
      }
      throw error;
    }

    const note = await prisma.note.create({
      data: {
        authorId: author.id,
        scope: noteScope,
        scopeRef: noteScopeRef,
        tag: noteTag,
        attachmentUrl: attachmentResult?.url,
        attachmentPath: attachmentResult?.path,
        content: content.trim(),
        strategyId: noteStrategyId,
        parentNoteId,
      },
      include: {
        author: true,
        strategy: true,
        parent: true,
      },
    });

    revalidatePath("/notes");
    revalidatePath("/");

    return NextResponse.json({
      ok: true,
      note: {
        id: note.id,
        scope: note.scope,
        scopeRef: note.scopeRef,
        tag: note.tag,
        content: note.content,
        createdAt: note.createdAt,
        parentNoteId: note.parentNoteId,
        attachmentUrl: note.attachmentUrl,
        author: {
          displayName: note.author.displayName,
        },
        strategy: note.strategy
          ? { id: note.strategy.id, name: note.strategy.name }
          : null,
      },
    });
  } catch (error) {
    console.error("[notes.create] Failed to create note", error);
    return NextResponse.json(
      { error: "Something went wrong while posting the note" },
      { status: 500 }
    );
  }
}
function deriveScopeFromTag(tag: (typeof TAG_OPTIONS)[number]) {
  if (tag === "daily-rhythm" || tag === "infra") {
    const today = new Date();
    const dateStamp = today.toISOString().split("T")[0];
    return {
      scope: "day" as const,
      scopeRef: tag === "daily-rhythm" ? dateStamp : "infra",
    };
  }

  if (tag === "strategy-threads") {
    return {
      scope: "strategy" as const,
      scopeRef: "strategy:general",
    };
  }

  return {
    scope: "trade" as const,
    scopeRef: "trade:general",
  };
}

type AttachmentInput = z.infer<typeof attachmentPayloadSchema>;

async function resolveAttachment(input: AttachmentInput) {
  if (!input) {
    return undefined;
  }

  if (typeof input === "string") {
    if (input.startsWith("data:image/")) {
      return uploadAttachmentFromDataUrl(input);
    }
    if (input.startsWith("http://") || input.startsWith("https://")) {
      return { url: input, path: undefined };
    }
    throw new Error("Unsupported attachment format");
  }

  return {
    url: input.url,
    path: input.path,
  };
}
