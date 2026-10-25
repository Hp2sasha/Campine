import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "success" | "error" | "info" | "warning";

const styles: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export default function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mb-6 rounded-xl border px-4 py-3 text-sm font-medium",
        styles[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
