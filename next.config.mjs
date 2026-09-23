import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: "/admin/subscriptions",
        destination: "/admin/members",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

// Required for local development: makes Cloudflare bindings (D1, KV, R2...)
// reachable from `next dev`. Without this call `getCloudflareContext().env.DB`
// is `undefined` locally, which is a confusing phantom bug to chase.
// See: node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.d.ts
initOpenNextCloudflareForDev();
