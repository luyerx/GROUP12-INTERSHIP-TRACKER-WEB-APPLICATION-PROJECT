"use client";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export const fieldClass = "mt-1.5 h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100";
export const labelClass = "text-sm font-medium text-slate-700";

export default function AdminModal({ title, description, children, onClose }: { title:string; description:string; children:React.ReactNode; onClose:()=>void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input, select, textarea, button, [href]")?.focus();
    const handler=(event:KeyboardEvent)=>{
      if(event.key === "Escape") onClose();
      if(event.key === "Tab" && dialogRef.current){
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("input, select, textarea, button, [href]"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if(event.shiftKey && document.activeElement === first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement === last){event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener("keydown",handler);
    return()=>{window.removeEventListener("keydown",handler);document.body.style.overflow=previousOverflow;previouslyFocused?.focus();};
  },[onClose]);
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" aria-describedby="admin-modal-description" onMouseDown={event=>{if(event.target===event.currentTarget) onClose()}}><div ref={dialogRef} className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white sm:max-w-xl sm:rounded-lg"><div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h2 id="admin-modal-title" className="text-lg font-semibold text-slate-950">{title}</h2><p id="admin-modal-description" className="mt-1 text-sm text-slate-500">{description}</p></div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4"/></button></div>{children}</div></div>;
}

export function ModalActions({ onCancel, destructiveLabel, onDelete }: { onCancel:()=>void; destructiveLabel?:string; onDelete?:()=>void }) { return <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center"><div className="sm:mr-auto">{onDelete && <button type="button" onClick={onDelete} className="text-sm font-medium text-rose-600 hover:text-rose-700">{destructiveLabel || "Delete"}</button>}</div><button type="button" onClick={onCancel} className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Save changes</button></div>; }
