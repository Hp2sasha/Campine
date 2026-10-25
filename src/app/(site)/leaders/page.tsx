import { getDict, getLocale } from "@/lib/i18n";
import { db } from "@/lib/db";
import LeaderCard from "@/components/LeaderCard";

export const dynamic = "force-dynamic";

export default async function LeadersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const dict = getDict();
  const now = new Date();
  const q = (searchParams.q ?? "").trim();

  const [leaders, ratingRows] = await Promise.all([
    db.user.findMany({
      where: {
        role: "leader",
        isSuspended: false,
        ...(q ? { name: { contains: q } } : {}),
      },
      include: {
        trips: {
          select: { id: true, status: true, endDate: true, leaderBanned: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.leaderReview.groupBy({
      by: ["leaderId"],
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const ratingMap = new Map(
    ratingRows.map((r) => [r.leaderId, { avg: r._avg.rating ?? 0, count: r._count.rating }])
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{dict.leaders.title}</h1>
          <p className="mt-2 text-slate-500">{dict.leaders.sub}</p>
        </div>
        <form method="GET" className="flex items-end gap-2">
          <div>
            <label htmlFor="leader-search" className="mb-1.5 block text-xs font-semibold text-slate-500">
              {dict.leaders.searchLabel}
            </label>
            <input
              id="leader-search"
              type="text"
              name="q"
              defaultValue={q}
              placeholder={dict.leaders.searchPh}
              className="w-64 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {dict.common.search}
          </button>
          {q && (
            <a
              href="/leaders"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {dict.trips.clear}
            </a>
          )}
        </form>
      </div>

      {leaders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-16 text-center text-slate-500">
          {dict.common.empty}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader) => {
            const r = ratingMap.get(leader.id);
            return (
              <LeaderCard
                key={leader.id}
                leader={leader}
                tripCount={leader.trips.filter((t) => !t.leaderBanned).length}
                completedCount={leader.trips.filter((t) => t.endDate < now).length}
                ratingAvg={r?.avg ?? null}
                ratingCount={r?.count ?? 0}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
