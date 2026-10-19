// Shows a saved ReviewSaathi monthly report on a clean link, e.g.
//   https://snehalpatel.dev/reviewsaathi/m/mahavir-dental-clinic-2026-10-19-5zyy
// The report data is stored on the ReviewSaathi server; this passes the page through.
export async function onRequestGet({ params }) {
  const id = String(params.id || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80);
  const notFound = () => new Response('This report was not found.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (!id) return notFound();
  const upstream = await fetch('https://aiservices-snehoo.duckdns.org/webhook/reviewsaathi-report-view?id=' + id);
  if (!upstream.ok) return notFound();
  const html = await upstream.text();
  if (html.length < 200) return notFound();
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
