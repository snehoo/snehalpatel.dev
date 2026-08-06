export async function onRequest(context) {
  const url = new URL(context.request.url);

  // If requesting /index.html, serve it directly (200) instead of redirecting
  if (url.pathname === '/index.html') {
    // Don't use context.next() for index.html, fetch the static asset directly
    const indexRequest = new Request(new URL('/', url.origin), {
      method: 'GET',
      headers: context.request.headers,
    });

    const response = await context.next();

    // Return the response as-is without redirect
    if (response.status === 308 || response.status === 301 || response.status === 302) {
      // Follow the redirect and return the final content with 200
      const finalUrl = response.headers.get('location');
      if (finalUrl) {
        return fetch(finalUrl, { method: 'GET' });
      }
    }

    return response;
  }

  return context.next();
}
