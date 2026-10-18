// Serves a saved ReviewSaathi report PDF from a clean link on this domain, e.g.
//   https://snehalpatel.dev/reviewsaathi/r/mahavir-dental-clinic-2026-10-18-2131-k7x2.pdf
// Add ?dl=1 to force a download. The PDF is stored on the ReviewSaathi server; this passes it through.
export async function onRequestGet({ params, request }) {
  const id = String(params.id || '').toLowerCase().replace(/\.pdf$/, '').replace(/[^a-z0-9-]/g, '').slice(0, 80);
  const notFound = () => new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (!id) return notFound();

  const dl = new URL(request.url).searchParams.get('dl') === '1' ? '&dl=1' : '';
  const upstream = await fetch('https://aiservices-snehoo.duckdns.org/webhook/reviewsaathi-pdf?id=' + id + dl);
  if (!upstream.ok) return notFound();
  const body = await upstream.arrayBuffer();
  if (body.byteLength < 100) return notFound();

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': upstream.headers.get('content-disposition') || 'inline; filename="ReviewSaathi.pdf"',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
