import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * گاردِ مرکزیِ ادمین — یک‌بار برایِ همه‌یِ /panel/admin/* اجرا می‌شه
 * تا فراموشیِ requireUser در صفحاتِ آینده پیش نیاد.
 * هر page.tsx همچنان می‌تونه جداگانه requireUser بزنه (defense in depth)
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser(["admin"]);
  return <>{children}</>;
}
