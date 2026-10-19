// Shows a saved ReviewSaathi monthly report on a clean link:
//   https://snehalpatel.dev/reviewsaathi/m/mahavir-dental-clinic-2026-10-19-5zyy       (the report page)
//   https://snehalpatel.dev/reviewsaathi/m/mahavir-dental-clinic-2026-10-19-5zyy.pdf   (the saved PDF)
// The data is stored on the ReviewSaathi server; this passes it through.
export async function onRequestGet({ params }) {
  const raw = String(params.id || '').toLowerCase();
  const wantsPdf = /\.pdf$/.test(raw);
  const id = raw.replace(/\.pdf$/, '').replace(/[^a-z0-9-]/g, '').slice(0, 80);
  const notFound = (msg) => new Response(msg || 'This report was not found.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (!id) return notFound();

  if (wantsPdf) {
    const up = await fetch('https://aiservices-snehoo.duckdns.org/webhook/reviewsaathi-report-pdf?id=' + id);
    if (!up.ok) return notFound('This PDF is not ready yet. Open the report page once and it will be saved.');
    const body = await up.arrayBuffer();
    if (body.byteLength < 100) return notFound('This PDF is not ready yet.');
    return new Response(body, { status: 200, headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': up.headers.get('content-disposition') || 'inline; filename="ReviewSaathi report.pdf"',
      'Cache-Control': 'public, max-age=3600', 'X-Robots-Tag': 'noindex, nofollow' } });
  }

  const upstream = await fetch('https://aiservices-snehoo.duckdns.org/webhook/reviewsaathi-report-view?id=' + id);
  if (!upstream.ok) return notFound();
  const html = await upstream.text();
  if (html.length < 200) return notFound();
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}
