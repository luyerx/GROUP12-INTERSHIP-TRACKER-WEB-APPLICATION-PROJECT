"use client";
import { Application } from "@/components/applications/detailTypes";
import ModalFrame from "@/components/ui/ModalFrame";
import {
  LoaderCircle,
  Trash2,
  X
} from "lucide-react";

export default function DeleteApplicationModal({ application, isDeleting, setShowDeleteModal, handleDelete }: { application: Application; isDeleting: boolean; setShowDeleteModal: (open: boolean) => void; handleDelete: () => Promise<void> }) {
  return (<ModalFrame
    label="Delete application"
    onClose={() => {
      if (!isDeleting) setShowDeleteModal(false);
    }}
    className="fixed inset-0 z-50 flex items-center justify-center px-4"
  >
    <button
      type="button"
      aria-label="Close delete confirmation"
      onClick={() => {
        if (!isDeleting) {
          setShowDeleteModal(false);
        }
      }}
      className="absolute inset-0 bg-slate-950/40 "
    />

    <div className="relative z-10 w-full max-w-md card p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Trash2 className="h-5 w-5" />
        </div>

        <button
          type="button"
          disabled={isDeleting}
          onClick={() => setShowDeleteModal(false)}
          aria-label="Close delete confirmation"
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <h2 className="mt-5 text-lg font-semibold text-slate-950">
        Delete application?
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        You are about to permanently delete the application for{" "}
        <span className="font-medium text-slate-700">
          {application.roleTitle}
        </span>{" "}
        at{" "}
        <span className="font-medium text-slate-700">
          {application.organisation}
        </span>
        .
      </p>

      <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3">
        <p className="text-xs leading-5 text-rose-700">
          This action cannot be undone once the application is deleted.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => setShowDeleteModal(false)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={isDeleting}
          onClick={() => void handleDelete()}
          className="inline-flex min-w-35 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete application
            </>
          )}
        </button>
      </div>
    </div>
  </ModalFrame>);
}
