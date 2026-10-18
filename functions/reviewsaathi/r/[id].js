// Serves a saved ReviewSaathi sample PDF from a clean link on this domain, e.g.
//   https://snehalpatel.dev/reviewsaathi/r/abc123.pdf
// The PDF itself is stored on the ReviewSaathi server; this just passes it through.
export async function onRequestGet({ params }) {
  const id = String(params.id || '').toLowerCase().replace(/\.pdf$/, '').replace(/[^a-z0-9]/g, '').slice(0, 40);
  const notFound = () => new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (!id) return notFound();

  const upstream = await fetch('https://aiservices-snehoo.duckdns.org/webhook/reviewsaathi-pdf?id=' + id);
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
