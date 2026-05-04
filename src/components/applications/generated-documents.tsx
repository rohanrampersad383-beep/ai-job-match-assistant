import { DocumentType } from "@prisma/client";

import { DocumentActions } from "@/components/applications/document-actions";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const documentOrder = [
  DocumentType.COVER_LETTER,
  DocumentType.PROFESSIONAL_SUMMARY,
  DocumentType.RESUME_BULLET_SUGGESTIONS,
  DocumentType.APPLICATION_ANSWERS
];

export function GeneratedDocuments({
  documents
}: {
  documents: Array<{ id: string; type: DocumentType; title: string; content: string }>;
}) {
  const ordered = documentOrder
    .map((type) => documents.find((document) => document.type === type))
    .filter((document): document is NonNullable<typeof document> => Boolean(document));

  if (!ordered.length) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {ordered.map((document) => (
        <Card key={document.id} className="bg-white/80">
          <CardTitle>{document.title}</CardTitle>
          <CardDescription className="mt-2">
            Editable draft based only on your existing profile and resume data.
          </CardDescription>
          <div className="mt-4">
            <DocumentActions content={document.content} title={document.title} />
          </div>
          <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--secondary)]">
            {document.content}
          </pre>
        </Card>
      ))}
    </div>
  );
}
