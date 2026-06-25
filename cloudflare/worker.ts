export interface Env {
  ASSETS: Fetcher;
  API_ORIGIN?: string;
}

function withoutTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (!env.API_ORIGIN) {
        return Response.json(
          {
            error:
              "Cloudflare API proxy is not configured. Set API_ORIGIN to your Node API origin.",
          },
          { status: 503 },
        );
      }

      const apiUrl = new URL(url);
      apiUrl.protocol = new URL(env.API_ORIGIN).protocol;
      apiUrl.host = new URL(env.API_ORIGIN).host;

      return fetch(new Request(apiUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
