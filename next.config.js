/** @type {import('next').NextConfig} */
// eslint-disable-next-line import/no-extraneous-dependencies
const withTM = require('next-transpile-modules')([
  '@mui/material',
  '@mui/system',
  '@mui/icons-material', // If @mui/icons-material is being used
]);

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    // eslint-disable-next-line no-param-reassign
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@mui/styled-engine': '@mui/styled-engine-sc',
      },
    };
    return config;
  },
};

module.exports = withTM(nextConfig);
