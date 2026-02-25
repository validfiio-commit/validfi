/** @type {import('next').NextConfig} */
const nextConfig = {};
config.resolve.alias = {
  ...config.resolve.alias,
  "@react-native-async-storage/async-storage": false,
};
config.resolve.fallback = {
  ...config.resolve.fallback,
  "pino-pretty": false,
};
module.exports = nextConfig;
