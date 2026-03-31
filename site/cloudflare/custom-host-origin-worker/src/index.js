const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function getUpstreamOrigin(env) {
  return (env.UPSTREAM_ORIGIN || "https://connect.soruyorum.live").trim();
}

function buildUpstreamRequest(request, env) {
  const incomingUrl = new URL(request.url);
  const upstreamBase = new URL(getUpstreamOrigin(env));
  const upstreamUrl = new URL(request.url);

  upstreamUrl.protocol = upstreamBase.protocol;
  upstreamUrl.hostname = upstreamBase.hostname;
  upstreamUrl.port = upstreamBase.port;

  const headers = new Headers(request.headers);
  for (const headerName of HOP_BY_HOP_HEADERS) {
    headers.delete(headerName);
  }

  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-original-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));
  headers.set(
    "x-forwarded-port",
    incomingUrl.port || (incomingUrl.protocol === "https:" ? "443" : "80"),
  );
  headers.set("x-custom-hostname", incomingUrl.host);

  const clientIp = request.headers.get("cf-connecting-ip");
  if (clientIp) {
    headers.set("x-real-ip", clientIp);
    const forwardedFor = request.headers.get("x-forwarded-for");
    headers.set(
      "x-forwarded-for",
      forwardedFor && forwardedFor.length > 0
        ? `${forwardedFor}, ${clientIp}`
        : clientIp,
    );
  }

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method.toUpperCase())) {
    init.body = request.body;
  }

  return new Request(upstreamUrl.toString(), init);
}

export default {
  async fetch(request, env) {
    const incomingUrl = new URL(request.url);
    const upstreamBase = new URL(getUpstreamOrigin(env));

    // The upstream host must bypass the Worker route in Cloudflare dashboard.
    if (incomingUrl.host === upstreamBase.host) {
      return new Response(
        "Worker route upstream host ile cakismis. connect.soruyorum.live/* icin Worker None tanimlayin.",
        { status: 500 },
      );
    }

    const upstreamRequest = buildUpstreamRequest(request, env);
    return fetch(upstreamRequest, {
      cf: {
        cacheEverything: false,
        cacheTtl: 0,
      },
    });
  },
};
