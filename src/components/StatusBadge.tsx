import clsx from "clsx";

type Tone = "gray" | "amber" | "blue" | "green" | "red" | "purple" | "slate";

const tones: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  slate: "bg-slate-700 text-white ring-slate-700",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
};

export const tripStatusTone: Record<string, Tone> = {
  draft: "gray",
  pending: "amber",
  approved: "blue",
  published: "green",
  rejected: "red",
  cancelled: "slate",
  completed: "purple",
};

export const bookingStatusTone: Record<string, Tone> = {
  pending: "amber",
  approved: "blue",
  rejected: "red",
  paid: "green",
  cancelled: "slate",
  completed: "purple",
};

export default function StatusBadge({
  label,
  tone = "gray",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
