import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import {
  approveCooperationAction,
  rejectCooperationAction,
} from "@/lib/actions/cooperation";

export const dynamic = "force-dynamic";

export default async function AdminCooperationPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["admin"]);
  const t = dict.coop;

  const requests = await db.cooperationRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, role: true } } },
  });

  const statusLabel: Record<string, string> = {
    pending: t.statusPending,
    approved: t.statusApproved,
    rejected: t.statusRejected,
  };
  const statusTone: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <PanelShell user={{ id: user.id, name: user.name, email: user.email ?? "", role: user.role }} active="cooperation">
      {searchParams.approved && (
        <Alert tone="success" className="mb-6">{t.approvedDone}</Alert>
      )}
      {searchParams.rejected && (
        <Alert tone="info" className="mb-6">{t.rejectedDone}</Alert>
      )}
      {searchParams.error && (
        <Alert tone="error" className="mb-6">{dict.auth.errRequired}</Alert>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-extrabold text-slate-900">{t.adminTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.adminSub}</p>

        {requests.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-500">{t.empty}</p>
        ) : (
          <div className="mt-6 space-y-4">
            {requests.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">{r.name}</span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusTone[r.status]}`}
                      >
                        {statusLabel[r.status]}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span dir="ltr">{r.phone}</span>
                      {r.email && <span dir="ltr">{r.email}</span>}
                      {r.city && <span>{r.city}</span>}
                      <span>{formatDate(r.createdAt, locale)}</span>
                      {r.user && <span>→ {r.user.name} ({dict.roles[r.user.role as keyof typeof dict.roles]})</span>}
                    </div>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <form action={approveCooperationAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-700"
                        >
                          {t.approve}
                        </button>
                      </form>
                      <form action={rejectCooperationAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                        >
                          {t.reject}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-600">
                  {r.message}
                </p>
                {(r.idCardUrl || r.licenseUrls) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-600">{t.uploadedDocs}:</span>
                    {r.idCardUrl && (
                      <a
                        href={r.idCardUrl}
                        target="_blank"
                        rel="noopener"
                        className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-semibold text-brand-800 hover:bg-brand-100"
                      >
                        📄 {t.idCardDoc}
                      </a>
                    )}
                    {(() => {
                      let urls: string[] = [];
                      try {
                        urls = JSON.parse(r.licenseUrls || "[]");
                      } catch {
                        urls = [];
                      }
                      return urls.map((u, i) => (
                        <a
                          key={u}
                          href={u}
                          target="_blank"
                          rel="noopener"
                          className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-semibold text-brand-800 hover:bg-brand-100"
                        >
                          📄 {t.licenseDocs} {i + 1}
                        </a>
                      ));
                    })()}
                  </div>
                )}
                {r.adminNote && (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {dict.common.details}: {r.adminNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}
