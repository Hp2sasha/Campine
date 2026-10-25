import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import { updateProfileAction } from "@/lib/actions/profile";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500";
const label = "mb-1.5 block text-xs font-semibold text-slate-600";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const dict = getDict();
  const user = await requireUser();

  return (
    <PanelShell user={user} active="profile">
      {searchParams.saved && <Alert tone="success">{dict.common.save} ✓</Alert>}
      {searchParams.error && (
        <Alert tone="error">
          {searchParams.error === "password"
            ? dict.validation.shortPassword
            : dict.validation.fillFields}
        </Alert>
      )}

      <form
        action={updateProfileAction}
        className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label}>{dict.common.name} *</label>
            <input name="name" required defaultValue={user.name} className={field} />
          </div>
          <div>
            <label className={label}>{dict.common.phone}</label>
            <input name="phone" defaultValue={user.phone ?? ""} className={field} dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>{dict.common.email}</label>
            <input
              value={user.email ?? ""}
              disabled
              className={`${field} bg-slate-50 text-slate-400`}
              dir="ltr"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>{dict.common.description} (FA)</label>
            <textarea name="bio" rows={3} defaultValue={user.bio ?? ""} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>{dict.common.description} (EN)</label>
            <textarea name="bioEn" rows={3} defaultValue={user.bioEn ?? ""} className={field} dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>{dict.leader.fImage}</label>
            <input name="avatarUrl" defaultValue={user.avatarUrl ?? ""} className={field} dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>
              {dict.auth.password} ({dict.common.optional})
            </label>
            <input
              type="password"
              name="password"
              placeholder={dict.auth.passwordPh}
              className={field}
              dir="ltr"
            />
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            {dict.common.save}
          </button>
        </div>
      </form>
    </PanelShell>
  );
}
