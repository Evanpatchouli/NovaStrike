export const env = {
  httpHost: process.env.NOVASTRIKE_HTTP_HOST ?? "127.0.0.1",
  httpPort: Number(process.env.NOVASTRIKE_HTTP_PORT ?? 3000),
  wsHost: process.env.NOVASTRIKE_WS_HOST ?? "127.0.0.1",
  wsPort: Number(process.env.NOVASTRIKE_WS_PORT ?? 3001)
};
