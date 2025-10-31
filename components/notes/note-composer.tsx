"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tagOptions = [
  { value: "daily-rhythm", label: "Daily rhythm" },
  { value: "strategy-threads", label: "Strategy threads" },
  { value: "trade-notes", label: "Trade notes" },
  { value: "infra", label: "Infra" },
] as const;

type NoteTag = (typeof tagOptions)[number]["value"];

export function NoteComposer() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const [form, setForm] = useState<{
    name: string;
    tag: NoteTag;
    content: string;
  }>({
    name: "",
    tag: (tagOptions[0]?.value ?? "daily-rhythm") as NoteTag,
    content: "",
  });
  const [attachment, setAttachment] = useState<{
    dataUrl: string | null;
    fileName: string | null;
  }>({ dataUrl: null, fileName: null });

  function handleAttachment(file?: File | null) {
    if (!file) {
      setAttachment({ dataUrl: null, fileName: null });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        dataUrl: typeof reader.result === "string" ? reader.result : null,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setFeedback({ status: "idle", message: "" });

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      content: form.content.trim(),
      tag: form.tag,
    };

    if (attachment.dataUrl) {
      payload.attachment = attachment.dataUrl;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          const message =
            data?.error ??
            "We couldn't save that note. Double-check the fields and try again.";
          setFeedback({ status: "error", message });
          return;
        }

        setFeedback({
          status: "success",
          message: "Note shared with the desk — thank you!",
        });

        setForm((prev) => ({
          ...prev,
          content: "",
          tag: prev.tag,
        }));
        setAttachment({ dataUrl: null, fileName: null });

        router.refresh();
      } catch {
        setFeedback({
          status: "error",
          message: "Network hiccup — please retry in a moment.",
        });
      }
    });
  }

  return (
    <Card className="order-1 border-primary/20 shadow-sm lg:order-2">
      <CardHeader>
        <CardTitle>Share context</CardTitle>
      </CardHeader>
      <CardContent>
        {feedback.status !== "idle" && (
          <p
            className={`mt-3 text-sm ${
              feedback.status === "success" ? "text-emerald-500" : "text-destructive"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Your name"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Tag
            </label>
            <select
              value={form.tag}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  tag: event.target.value as NoteTag,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {tagOptions.map((tag) => (
                <option key={tag.value} value={tag.value}>
                  {tag.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Attach image</label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleAttachment(event.target.files?.[0] ?? null)}
                className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground"
              />
              {attachment.dataUrl && (
                <div className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                  <span className="truncate">{attachment.fileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleAttachment(null)}
                  >
                    Remove
                  </Button>
                </div>
              )}
              {attachment.dataUrl && (
                <div className="overflow-hidden rounded-md border border-border/60">
                  <Image
                    src={attachment.dataUrl}
                    alt="Attachment preview"
                    className="max-h-48 w-full object-contain"
                    width={800}
                    height={600}
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Comment
            </label>
            <textarea
              required
              value={form.content}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, content: event.target.value }))
              }
              placeholder="What changed, what broke, what's next?"
              rows={5}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Posting…" : "Post note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
