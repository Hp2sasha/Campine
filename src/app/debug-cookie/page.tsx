import { cookies, headers } from "next/headers";

export const dynamic = "force-dynamic";

export default function DebugCookiePage() {
  const c = cookies().getAll();
  const h = headers();
  return (
    <main className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold">Debug Cookie</h1>
      <p className="mt-4">Host: {h.get("host")}</p>
      <p>x-forwarded-proto: {h.get("x-forwarded-proto") ?? "none"}</p>
      <p>referer: {h.get("referer")?.slice(0,80) ?? "none"}</p>
      <p className="mt-4">Cookies count: {c.length}</p>
      <ul className="mt-2 list-disc pl-6">
        {c.map(x => <li key={x.name}>{x.name} = {x.value.slice(0,30)}... len={x.value.length}</li>)}
      </ul>
      <p className="mt-4">Go to <a className="text-blue-600 underline" href="/api/debug/set-cookie">/api/debug/set-cookie</a> to set test cookie, then come back here.</p>
      <p className="mt-2"><a className="text-blue-600 underline" href="/api/debug/session">/api/debug/session JSON</a></p>
    </main>
  );
}
