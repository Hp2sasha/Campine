import { notFound, redirect } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";
import Alert from "@/components/Alert";
import TripFormFields, { type TripValues } from "@/components/TripFormFields";
import { saveTripAction } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

const toISO = (d: Date) => d.toISOString().slice(0, 10);

export default async function EditTripPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const dict = getDict();
  const user = await requireUser(["leader", "admin"]);

  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const trip = await db.trip.findUnique({ where: { id } });
  if (!trip) notFound();
  if (trip.leaderId !== user.id && user.role !== "admin") {
    redirect("/panel/leader/trips?error=forbidden");
  }
  if (["cancelled", "completed"].includes(trip.status)) {
    redirect("/panel/leader/trips?error=locked");
  }

  const errors: Record<string, string> = {
    required: dict.validation.fillFields,
    dateOrder: dict.validation.dateOrder,
    price: dict.validation.priceMin,
    capacity: dict.validation.capacityMin,
  };

  const values: TripValues = {
    id: trip.id,
    title: trip.title,
    titleEn: trip.titleEn,
    destination: trip.destination,
    destinationEn: trip.destinationEn,
    description: trip.description,
    descriptionEn: trip.descriptionEn,
    includes: trip.includes,
    includesEn: trip.includesEn,
    excludes: trip.excludes,
    excludesEn: trip.excludesEn,
    startDate: toISO(trip.startDate),
    endDate: toISO(trip.endDate),
    price: trip.price,
    capacity: trip.capacity,
    imageUrl: trip.imageUrl,
  };

  return (
    <PanelShell user={user} active="trips">
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-slate-900">{dict.leader.editTripTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{trip.code}</p>
      </div>

      {searchParams.error && (
        <Alert tone="error">{errors[searchParams.error] ?? dict.validation.fillFields}</Alert>
      )}

      <form
        action={saveTripAction}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"
      >
        <TripFormFields trip={values} />

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
          <button
            type="submit"
            name="submitNow"
            value="0"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {dict.common.save}
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
      </form>
    </PanelShell>
  );
}
