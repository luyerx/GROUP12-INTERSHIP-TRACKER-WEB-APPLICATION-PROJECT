"use client";
import { ErrorState } from "@/components/ui/Feedback";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="p-6">
      <ErrorState
        title="We could not load this page"
        message="Please check your connection and try again."
        retry={reset}
      />
    </div>
  );
}
