"use client";
import Deadline from "@/components/ui/Deadline";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Pencil, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Application, ApplicationStatus } from "./detailTypes";
export default function ApplicationHeader({ application, status, id, setShowDeleteModal }: { application: Application; status: ApplicationStatus; id: string; setShowDeleteModal: (open: boolean) => void }) {
  return (<div className="mt-6"><PageHeader eyebrow={application.organisation} title={application.roleTitle}
    description={<><span>{application.location || "No location"}</span><span className="mx-3">·</span><Deadline value={application.deadline} /></>}
    action={<><StatusBadge value={status} /><Link className="btn-secondary" href="/ai-assistant"><Sparkles className="h-4 w-4" />Preparation tools</Link><Link className="btn-secondary" href={"/applications/" + id + "/edit"}><Pencil className="h-4 w-4" />Edit</Link><button type="button" onClick={() => setShowDeleteModal(true)} className="btn-secondary text-rose-700"><Trash2 className="h-4 w-4" />Delete</button></>}
  /></div>);
}
