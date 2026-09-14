"use client";
import { Plus } from "lucide-react";
export default function AdminAddButton({
  kind,
}: {
  kind: "resource" | "opportunity";
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(`admin:add:${kind}`))}
      className="btn "
    >
      <Plus className="h-4 w-4" />
      Add {kind}
    </button>
  );
}
