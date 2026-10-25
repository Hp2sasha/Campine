import { getDict, getLocale } from "@/lib/i18n";
import DateInput from "@/components/DateInput";

export type TripValues = {
  id?: number;
  title: string;
  titleEn: string | null;
  destination: string;
  destinationEn: string | null;
  description: string;
  descriptionEn: string;
  includes: string;
  includesEn: string;
  excludes: string;
  excludesEn: string;
  startDate: string; // Gregorian ISO YYYY-MM-DD
  endDate: string;
  price: number;
  capacity: number;
  imageUrl: string | null;
};

const field =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500";
const label = "mb-1.5 block text-xs font-semibold text-slate-600";

/** Form fields for creating/editing a trip (wrapped by the page's <form>). */
export default function TripFormFields({ trip }: { trip?: TripValues | null }) {
  const dict = getDict();
  const locale = getLocale();
  const t = trip;

  return (
    <>
      {t?.id ? <input type="hidden" name="id" value={t.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>{dict.leader.fTitle} *</label>
          <input name="title" required defaultValue={t?.title ?? ""} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{dict.leader.fTitleEn}</label>
          <input name="titleEn" defaultValue={t?.titleEn ?? ""} className={field} dir="ltr" />
        </div>
        <div>
          <label className={label}>{dict.leader.fDestination} *</label>
          <input name="destination" required defaultValue={t?.destination ?? ""} className={field} />
        </div>
        <div>
          <label className={label}>{dict.leader.fDestinationEn}</label>
          <input name="destinationEn" defaultValue={t?.destinationEn ?? ""} className={field} dir="ltr" />
        </div>
        <div>
          <label className={label}>{dict.leader.fStartDate} *</label>
          <DateInput
            name="startDate"
            locale={locale}
            defaultValue={t?.startDate ?? ""}
            required
          />
        </div>
        <div>
          <label className={label}>{dict.leader.fEndDate} *</label>
          <DateInput
            name="endDate"
            locale={locale}
            defaultValue={t?.endDate ?? ""}
            required
          />
        </div>
        <div>
          <label className={label}>{dict.leader.fPrice} *</label>
          <input type="number" name="price" required min={0} defaultValue={t?.price ?? ""} className={field} dir="ltr" />
          <p className="mt-1 text-[11px] text-slate-400">{dict.leader.fPriceHelp}</p>
        </div>
        <div>
          <label className={label}>{dict.leader.fCapacity} *</label>
          <input type="number" name="capacity" required min={1} defaultValue={t?.capacity ?? ""} className={field} dir="ltr" />
          <p className="mt-1 text-[11px] text-slate-400">{dict.leader.fCapacityHelp}</p>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{dict.leader.fImage}</label>
          <input
            name="imageUrl"
            defaultValue={t?.imageUrl ?? ""}
            placeholder={dict.leader.fImagePh}
            className={field}
            dir="ltr"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{dict.leader.fDescription}</label>
          <textarea name="description" rows={4} defaultValue={t?.description ?? ""} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{dict.leader.fDescriptionEn}</label>
          <textarea name="descriptionEn" rows={4} defaultValue={t?.descriptionEn ?? ""} className={field} dir="ltr" />
        </div>
        <div>
          <label className={label}>{dict.leader.fIncludes}</label>
          <textarea name="includes" rows={4} defaultValue={t?.includes ?? ""} className={field} />
        </div>
        <div>
          <label className={label}>{dict.leader.fExcludes}</label>
          <textarea name="excludes" rows={4} defaultValue={t?.excludes ?? ""} className={field} />
        </div>
        <div>
          <label className={label}>{dict.leader.fIncludes} (EN)</label>
          <textarea name="includesEn" rows={4} defaultValue={t?.includesEn ?? ""} className={field} dir="ltr" />
        </div>
        <div>
          <label className={label}>{dict.leader.fExcludes} (EN)</label>
          <textarea name="excludesEn" rows={4} defaultValue={t?.excludesEn ?? ""} className={field} dir="ltr" />
        </div>
      </div>
    </>
  );
}
