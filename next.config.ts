import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Workaround: o Turbopack (dev) entra em panic ("invalid utf-8 sequence") ao ler o source map
    // de entrada do r3f-perf. Só afeta mapas de dependências; os mapas do nosso código continuam.
    turbopackInputSourceMaps: false,
  },
};

export default nextConfig;
