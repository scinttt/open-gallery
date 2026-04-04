const allowedDevOrigins = ["127.0.0.1", "localhost"];

if (process.env.ALLOWED_DEV_ORIGIN) {
  allowedDevOrigins.push(process.env.ALLOWED_DEV_ORIGIN);
}

const nextConfig = {
  allowedDevOrigins,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
