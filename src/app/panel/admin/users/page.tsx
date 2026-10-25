import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import StatusBadge from "@/components/StatusBadge";
import {
  setSuspendedAction,
  setUserRoleAction,
} from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const dict = getDict();
  const locale = getLocale();
  const user = await requireUser(["admin"]);

  const users = await db.user.findMany({
    include: {
      _count: {
        select: { trips: true, bookings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PanelShell user={user} active="users">
      {searchParams.done && <Alert tone="success">{dict.common.save}</Alert>}
      {searchParams.error && (
        <Alert tone="error">{dict.validation.fillFields}</Alert>
      )}

      <p className="mb-6 text-sm text-slate-500">{dict.admin.usersSub}</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.name}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.email}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.role}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.status}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.common.createdAt}</th>
              <th className="px-4 py-3 text-start font-semibold">{dict.admin.userActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {u.name.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <div className="font-semibold text-slate-800">{u.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {u._count.trips} {dict.leaders.tripsCount} · {u._count.bookings}{" "}
                        {dict.panel.myBookings}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500" dir="ltr">
                  {u.email}
                </td>
                <td className="px-4 py-3">
                  {u.id === user.id ? (
                    <StatusBadge label={dict.roles[u.role as keyof typeof dict.roles]} tone="blue" />
                  ) : (
                    <form action={setUserRoleAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="back" value="/panel/admin/users" />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none"
                      >
                        <option value="passenger">{dict.roles.passenger}</option>
                        <option value="leader">{dict.roles.leader}</option>
                        <option value="admin">{dict.roles.admin}</option>
                      </select>
                      <button className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50">
                        {dict.common.save}
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.isSuspended ? (
                    <StatusBadge label={dict.admin.suspend} tone="red" />
                  ) : (
                    <StatusBadge label={dict.common.status} tone="green" />
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {formatDate(u.createdAt, locale)}
                </td>
                <td className="px-4 py-3">
                  {u.id !== user.id && u.role !== "admin" && (
                    <form action={setSuspendedAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="back" value="/panel/admin/users" />
                      {u.isSuspended ? (
                        <>
                          <input type="hidden" name="suspended" value="0" />
                          <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                            ✓ {dict.admin.unsuspend}
                          </button>
                        </>
                      ) : (
                        <>
                          <input type="hidden" name="suspended" value="1" />
                          <button className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100">
                            ⏸ {dict.admin.suspend}
                          </button>
                        </>
                      )}
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">{dict.admin.suspendHint}</p>
    </PanelShell>
  );
}
