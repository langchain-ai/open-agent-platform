/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Workaround: BlockNote imports '@tiptap/extension-gapcursor' which re-exports from '@tiptap/extensions'.
    // Ensure the bundler resolves to the canonical subpath to avoid export mismatches.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@tiptap/extension-gapcursor": "@tiptap/extensions/gap-cursor",
    };
    return config;
  },
};

export default nextConfig;
