import { mkdir, writeFile } from "fs/promises";
import path from "path";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const PDF_TYPE = "application/pdf";
const MAX_SIZE = 3 * 1024 * 1024; // 3MB
export const MAX_LICENSE_FILES = 5;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

async function saveOne(
  file: File | null | undefined,
  prefix: string,
  allowPdf: boolean
): Promise<UploadResult> {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "فایلی انتخاب نشده است" };
  }
  const isPdf = allowPdf && file.type === PDF_TYPE;
  const ext = isPdf ? "pdf" : IMAGE_TYPES[file.type];
  if (!ext) {
    return {
      ok: false,
      error: allowPdf
        ? "فرمت فایل باید JPG یا PNG یا WEBP یا PDF باشد"
        : "فرمت تصویر باید JPG یا PNG یا WEBP باشد",
    };
  }
  if (file.size > MAX_SIZE) return { ok: false, error: "حجم هر فایل نباید بیشتر از ۳ مگابایت باشد" };

  // چکِ magic bytes برای جلوگیری از جعلِ mime
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!isPdf) {
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50; // WEBP
    if (!isJpg && !isPng && !isWebp) {
      return { ok: false, error: "محتوای فایل با فرمت انتخابی همخوانی ندارد" };
    }
  } else {
    const isPdfMagic = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
    if (!isPdfMagic) return { ok: false, error: "فایل PDF معتبر نیست" };
  }

  const name = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { ok: true, url: `/uploads/${name}` };
}

export async function saveIdCardImage(file: File | null | undefined): Promise<UploadResult> {
  const saved = await saveOne(file, "idcard", false);
  if (!saved.ok) return { ok: false, error: "تصویر کارت ملی یا شناسنامه الزامی است" };
  return saved;
}

/** Saves up to MAX_LICENSE_FILES license/certificate files (image or PDF). */
export async function saveLicenseFiles(files: FileList | File[] | null | undefined): Promise<
  { ok: true; urls: string[] } | { ok: false; error: string }
> {
  const list = files ? Array.from(files).filter((f) => f && f.size > 0) : [];
  if (list.length === 0) return { ok: true, urls: [] };
  if (list.length > MAX_LICENSE_FILES) {
    return { ok: false, error: `حداکثر ${MAX_LICENSE_FILES} فایل مجوز انتخاب کنید` };
  }
  const urls: string[] = [];
  for (const f of list) {
    const saved = await saveOne(f, "license", true);
    if (!saved.ok) return { ok: false, error: `${f.name}: ${saved.error}` };
    urls.push(saved.url);
  }
  return { ok: true, urls };
}
