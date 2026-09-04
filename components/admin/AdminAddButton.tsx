"use client";
import { Plus } from "lucide-react";
export default function AdminAddButton({kind}:{kind:"resource"|"opportunity"}){return <button type="button" onClick={()=>window.dispatchEvent(new Event(`admin:add:${kind}`))} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><Plus className="h-4 w-4"/>Add {kind}</button>}
