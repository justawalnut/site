"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PublicReply = {
  id: number;
  createdAt: string;
  content: string;
  attachmentUrl?: string | null;
  author: {
    displayName: string | null;
  };
};

type PublicNote = {
  id: number;
  createdAt: string;
  scope: string;
  scopeRef: string;
  tag?: string | null;
  attachmentUrl?: string | null;
  content: string;
  parentNoteId?: number | null;
  author: {
    displayName: string | null;
  };
  strategy: {
    id: string;
    name: string;
  } | null;
  replies: PublicReply[];
};

interface NotesFeedProps {
  notes: PublicNote[];
}

const tabs = [
  { value: "all", label: "All" },
  { value: "daily-rhythm", label: "Daily rhythm" },
  { value: "strategy-threads", label: "Strategy threads" },
  { value: "trade-notes", label: "Trade notes" },
  { value: "infra", label: "Infra" },
];

const tagLabels: Record<string, string> = {
  "daily-rhythm": "Daily rhythm",
  "strategy-threads": "Strategy threads",
  "trade-notes": "Trade notes",
  infra: "Infra",
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

function resolveTag(note: PublicNote) {
  if (note.tag) {
    return note.tag === "infraa" ? "infra" : note.tag;
  }
  if (note.scope === "strategy") return "strategy-threads";
  if (note.scope === "trade") return "trade-notes";
  return "daily-rhythm";
}

function getFilteredNotes(notes: PublicNote[], value: string) {
  if (value === "all") {
    return notes;
  }
  return notes.filter((note) => resolveTag(note) === value);
}

function NoteReplyForm({
  noteId,
  onSubmitted,
}: {
  noteId: number;
  onSubmitted: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", content: "" });
  const [attachment, setAttachment] = useState<{
    path: string;
    url: string;
    fileName: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    status: "idle" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [isPending, startTransition] = useTransition();
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  async function discardAttachment(path: string) {
    try {
      await fetch("/api/notes/attachments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
    } catch (error) {
      console.warn("Failed to discard attachment", error);
    }
  }

  async function handleAttachment(file?: File | null) {
    if (!file) {
      if (attachment) {
        await discardAttachment(attachment.path);
      }
      setAttachment(null);
      return;
    }

    if (file.size > 2_000_000) {
      setFeedback({
        status: "error",
        message: "Attachments are limited to 2 MB.",
      });
      return;
    }

    if (attachment) {
      await discardAttachment(attachment.path);
      setAttachment(null);
    }

    setFeedback({ status: "idle", message: "" });
    setIsUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/notes/attachments", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({
          status: "error",
          message:
            data?.error ?? "Upload failed — please retry after a moment.",
        });
        return;
      }
      setAttachment({
        path: data.path,
        url: data.url,
        fileName: file.name,
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        status: "error",
        message: "Upload failed — check your connection.",
      });
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || isUploadingAttachment) return;

    setFeedback({ status: "idle", message: "" });

    startTransition(async () => {
      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            content: form.content.trim(),
            parentId: noteId,
            attachment: attachment
              ? {
                  path: attachment.path,
                  url: attachment.url,
                }
              : undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback({
            status: "error",
            message:
              data?.error ?? "Reply failed — please double-check your message.",
          });
          return;
        }

        setForm({ name: "", content: "" });
        setAttachment(null);
        onSubmitted();
        router.refresh();
      } catch (error) {
        console.error(error);
        setFeedback({
          status: "error",
          message: "Network hiccup — retry shortly.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border bg-muted/40 p-3">
      <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
        <input
          required
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder="Your name"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <textarea
          required
          value={form.content}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, content: event.target.value }))
          }
          rows={3}
          placeholder="Add a quick reply"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="space-y-2 text-xs">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleAttachment(event.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground"
        />
        {isUploadingAttachment && (
          <p className="text-xs text-muted-foreground">Uploading attachment…</p>
        )}
        {attachment && (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2">
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
            <div className="overflow-hidden rounded-md border border-border/60">
              <Image
                src={attachment.url}
                alt="Attachment preview"
                className="max-h-48 w-full object-contain"
                width={800}
                height={600}
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
      {feedback.status === "error" && (
        <p className="text-xs text-destructive">{feedback.message}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || isUploadingAttachment}
          className="px-3"
        >
          {isPending
            ? "Sending…"
            : isUploadingAttachment
              ? "Waiting for upload…"
              : "Post reply"}
        </Button>
      </div>
    </form>
  );
}

export function NotesFeed({ notes }: NotesFeedProps) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="flex flex-wrap gap-2 bg-muted/40 p-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex-1 min-w-[120px] rounded-full px-3 py-1 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => {
        const filteredNotes = getFilteredNotes(notes, tab.value);

        return (
          <TabsContent key={tab.value} value={tab.value} className="mt-4 space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                Nothing here yet. Drop a note to kick things off.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const noteTag = resolveTag(note);

                return (
                  <article
                    key={note.id}
                    className="space-y-3 rounded-lg border border-border/50 bg-card/80 p-4 shadow-sm transition hover:border-primary/40"
                  >
                    <header className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {note.author.displayName ?? "Anonymous"}
                      </span>
                      <Badge variant="outline" className="text-[0.65rem]">
                        {tagLabels[noteTag] ?? noteTag}
                      </Badge>
                      {note.strategy && (
                        <Badge variant="outline" className="text-[0.65rem]">
                          {note.strategy.name}
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatTimestamp(note.createdAt)}
                      </span>
                    </header>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {note.content}
                    </p>
                    {note.attachmentUrl && (
                      <figure className="overflow-hidden rounded-md border border-border/60">
                        <Image
                          src={note.attachmentUrl}
                          alt="Note attachment"
                          className="max-h-72 w-full object-contain"
                          width={1000}
                          height={750}
                          unoptimized
                        />
                      </figure>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {note.replies.length} repl{note.replies.length === 1 ? "y" : "ies"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          setReplyingTo((current) =>
                            current === note.id ? null : note.id
                          )
                        }
                      >
                        {replyingTo === note.id ? "Hide reply" : "Add reply"}
                      </Button>
                    </div>
                    {note.replies.length > 0 && (
                      <div className="space-y-3 rounded-lg border border-dashed border-border/60 bg-background/60 p-3">
                        {note.replies.map((reply) => (
                          <div key={reply.id} className="space-y-1 rounded-md bg-muted/40 p-3">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-semibold">
                                {reply.author.displayName ?? "Anonymous"}
                              </span>
                              <span className="ml-auto text-muted-foreground">
                                {formatTimestamp(reply.createdAt)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                              {reply.content}
                            </p>
                            {reply.attachmentUrl && (
                              <figure className="overflow-hidden rounded-md border border-border/60">
                                <Image
                                  src={reply.attachmentUrl}
                                  alt="Reply attachment"
                                  className="max-h-64 w-full object-contain"
                                  width={900}
                                  height={675}
                                  unoptimized
                                />
                              </figure>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {replyingTo === note.id && (
                      <NoteReplyForm
                        noteId={note.id}
                        onSubmitted={() => setReplyingTo(null)}
                      />
                    )}
                  </article>
                );
              })
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
