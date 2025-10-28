import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 讓 Next 產出可獨立執行的 server（配合 Dockerfile 最穩）
  output: "standalone",
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
