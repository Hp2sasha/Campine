import { getDict } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import TripFormFields from "@/components/TripFormFields";
import { saveTripAction } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const dict = getDict();
  const user = await requireUser(["leader", "admin"]);

  const errors: Record<string, string> = {
    required: dict.validation.fillFields,
    dateOrder: dict.validation.dateOrder,
    price: dict.validation.priceMin,
    capacity: dict.validation.capacityMin,
  };

  return (
    <PanelShell user={user} active="new">
      <div className="mb-6">
        <p className="text-sm text-slate-500">{dict.leader.newTripSub}</p>
      </div>

      {searchParams.error && (
        <Alert tone="error">{errors[searchParams.error] ?? dict.validation.fillFields}</Alert>
      )}

      <form
        action={saveTripAction}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"
      >
        <TripFormFields />

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <button
            type="submit"
            name="submitNow"
            value="0"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {dict.leader.saveDraft}
          </button>
          <button
            type="submit"
            name="submitNow"
            value="1"
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            {dict.leader.submitApproval}
          </button>
        </div>
        <p className="mt-4 text-xs leading-6 text-slate-400">
          {dict.statusHints.trip.draft} {dict.statusHints.trip.approved}
        </p>
      </form>
    </PanelShell>
  );
}
