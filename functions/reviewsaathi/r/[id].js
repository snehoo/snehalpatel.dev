// Serves a saved ReviewSaathi sample PDF from a clean link on this domain.
// The PDF itself is stored on the ReviewSaathi server; this just passes it through.
export async function onRequestGet({ params }) {
  const id = String(params.id || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  if (!id) return new Response('Not found', { status: 404 });

  const upstream = await fetch('https://aiservices-snehoo.duckdns.org/webhook/reviewsaathi-pdf?id=' + id);
  if (!upstream.ok) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': upstream.headers.get('content-disposition') || 'inline; filename="ReviewSaathi.pdf"',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
