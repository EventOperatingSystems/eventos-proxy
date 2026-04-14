export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const targets = [
    process.env.TARGET_URL_PROD,
    process.env.TARGET_URL_DEV,
  ].filter(Boolean) as string[];

  if (targets.length === 0) {
    return new Response('No proxy targets configured', { status: 500 });
  }

  const url = new URL(request.url);
  const isReadOnly = ['GET', 'HEAD'].includes(request.method);

  for (let i = 0; i < targets.length; i++) {
    const targetUrl = targets[i].replace(/\/$/, '') + url.pathname + url.search;
    const headers = new Headers(request.headers);
    headers.set('x-forwarded-host', url.hostname);

    const init: RequestInit & { duplex?: string } = { method: request.method, headers };
    if (!isReadOnly) { init.body = request.body; init.duplex = 'half'; }

    try {
      const response = await fetch(targetUrl, init);
      // If this server has the data, use it. If 404 and more targets, try the next.
      if (response.status !== 404 || i === targets.length - 1) {
        return new Response(response.body, { status: response.status, headers: response.headers });
      }
    } catch {
      if (i === targets.length - 1) return new Response('Proxy error', { status: 502 });
    }
  }

  return new Response('Not found', { status: 404 });
}
