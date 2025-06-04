import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Google Fontsの読み込みを最適化
        '*.{woff,woff2,eot,ttf,otf}': {
          loaders: ['file-loader'],
          as: '*.{woff,woff2,eot,ttf,otf}',
        },
      },
    },
  },
  // フォントの最適化を有効にする
  optimizeFonts: true,
};

export default nextConfig;
