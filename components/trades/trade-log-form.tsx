"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

interface StatusMessage {
  status: "idle" | "success" | "error";
  message: string;
}

export function TradeLogForm() {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    preMarket: "",
    postMarket: "",
  });
  const [feedback, setFeedback] = useState<StatusMessage>({ status: "idle", message: "" });

  const todayDisplay = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const name = form.name.trim();
    const pre = form.preMarket.trim();
    const post = form.postMarket.trim();

    if (!name) {
      setFeedback({ status: "error", message: "Add your name before posting." });
      return;
    }

    const payloads = [] as Array<Record<string, unknown>>;

    if (pre) {
      payloads.push({
        name,
        tag: "trade-notes",
        content: `Pre-market overview (${todayDisplay})\n${pre}`,
      });
    }

    if (post) {
      payloads.push({
        name,
        tag: "trade-notes",
        content: `Post-market overview (${todayDisplay})\n${post}`,
      });
    }

    if (payloads.length === 0) {
      setFeedback({ status: "error", message: "Write a pre or post-market note before submitting." });
      return;
    }

    setFeedback({ status: "idle", message: "" });

    startTransition(async () => {
      try {
        for (const payload of payloads) {
          const response = await fetch("/api/notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.error ?? "Failed to post trade log.");
          }
        }

        setFeedback({ status: "success", message: "Trade logs published for today." });
        setForm((prev) => ({ ...prev, preMarket: "", postMarket: "" }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        setFeedback({ status: "error", message });
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Name</label>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Your name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">Date</p>
          <p className="rounded-md border border-dashed border-border px-3 py-2">{todayDisplay}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Pre-market overview</label>
        <textarea
          value={form.preMarket}
          onChange={(event) => setForm((prev) => ({ ...prev, preMarket: event.target.value }))}
          placeholder="Plan the session: levels, catalysts, execution focus."
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Post-market overview</label>
        <textarea
          value={form.postMarket}
          onChange={(event) => setForm((prev) => ({ ...prev, postMarket: event.target.value }))}
          placeholder="Wrap the day: fills, slippage, lessons, follow-ups."
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {feedback.status !== "idle" && (
        <p
          className={`text-sm ${
            feedback.status === "success" ? "text-emerald-500" : "text-destructive"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Publishing…" : "Log today’s trades"}
        </Button>
      </div>
    </form>
  );
}
