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
    <div className="panel stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>

        <div className="state-icon !h-10 !w-10 !rounded-xl">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
