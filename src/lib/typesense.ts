import Typesense from "typesense";

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TS_HOST!, // e.g. 9nspjgxya6o8vhz7p-1.a1.typesense.net
      port: Number(process.env.TS_PORT ?? 443), // 443 for Cloud
      protocol: process.env.TS_PROTOCOL ?? "https", // https for Cloud
    },
  ],
  apiKey: process.env.TS_ADMIN_KEY!, // admin key from api-keys.txt
  connectionTimeoutSeconds: 60,
});

export default client;
