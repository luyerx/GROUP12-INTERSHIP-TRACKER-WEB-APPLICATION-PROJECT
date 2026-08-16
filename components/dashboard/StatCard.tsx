import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
};

export default function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="border-b border-slate-200 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>

        <div className="text-slate-400">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
