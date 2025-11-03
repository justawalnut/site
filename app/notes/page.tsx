import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotesFeed } from "@/components/notes/notes-feed";
import { NoteComposer } from "@/components/notes/note-composer";

export const dynamic = 'force-dynamic';

async function getNotesPageData() {
  const notes = await prisma.note.findMany({
    where: {
      parentNoteId: null,
    },
    include: {
      author: true,
      strategy: true,
      replies: {
        include: {
          author: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return { notes };
}

export default async function NotesPage() {
  const { notes: rawNotes } = await getNotesPageData();

  const notes = rawNotes.map((note) => {
    const normalizedTag = note.tag === "infraa" ? "infra" : note.tag;
    const derivedTag =
      normalizedTag ??
      (note.scope === "strategy"
        ? "strategy-threads"
        : note.scope === "trade"
          ? "trade-notes"
          : "daily-rhythm");

    return {
      id: note.id,
      scope: note.scope,
      scopeRef: note.scopeRef,
      tag: derivedTag,
      attachmentUrl: note.attachmentUrl,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      parentNoteId: note.parentNoteId,
      author: {
        displayName: note.author.displayName ?? note.author.email,
      },
      strategy: note.strategy
        ? {
            id: note.strategy.id,
            name: note.strategy.name,
          }
        : null,
      replies: note.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        attachmentUrl: reply.attachmentUrl,
        author: {
          displayName: reply.author.displayName ?? reply.author.email,
        },
      })),
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Notes</h1>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="order-2 border-primary/20 shadow-sm lg:order-1">
          <CardHeader>
            <CardTitle>Team feed</CardTitle>
            <CardDescription>
              Every update is logged for the desk — filter by Daily rhythm, Strategy threads,
              Trade notes, or Infra.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotesFeed notes={notes} />
          </CardContent>
        </Card>

        <NoteComposer />
      </div>
    </div>
  );
}
