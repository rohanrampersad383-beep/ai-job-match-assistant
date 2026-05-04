"use client";

import { Download, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DocumentActions({
  title,
  content
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        size="sm"
        type="button"
        variant="secondary"
        onClick={() => navigator.clipboard.writeText(content)}
      >
        <Copy className="mr-2 size-4" />
        Copy
      </Button>
      <Button
        size="sm"
        type="button"
        variant="secondary"
        onClick={() => downloadTextFile(`${title.replace(/\s+/g, "-").toLowerCase()}.txt`, content)}
      >
        <Download className="mr-2 size-4" />
        Export
      </Button>
    </div>
  );
}
