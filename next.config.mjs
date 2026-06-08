// TZ §8 — security headers. CSP is intentionally permissive for inline
// scripts/styles (Next.js + Tailwind + next-auth runtime emit them); the
// follow-up phase ratchets it down by adopting nonces.

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: https: blob:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://api.yookassa.ru https://*.upstash.io",
      "frame-src https://yoomoney.ru https://*.yookassa.ru",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://yoomoney.ru https://*.yookassa.ru",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    // TZ §10.1 — only allow remote images from our own storage CDN. Seed
    // fixtures use local files under public/seed/. To allow an additional
    // host (e.g. S3 / R2 / Yandex Object Storage), add a remotePatterns
    // entry pinned to that domain — do NOT use a wildcard.
    remotePatterns: [
      // Example, uncomment & adjust when STORAGE_PROVIDER=s3:
      // { protocol: "https", hostname: "cdn.neuromarket.example" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
    webpackBuildWorker: false,
    workerThreads: false,
    cpus: 1,
  },
  webpack: (config, { isServer }) => {
    config.cache = false;
    config.parallelism = 1;
    config.optimization = {
      ...config.optimization,
      minimize: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
