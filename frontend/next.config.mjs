/** @type {import('next').NextConfig} */
const nextConfig = {
  // The app is fully client-side (it only talks to the API from the browser),
  // so it ships as plain static files. Render serves them from a CDN: free and
  // no cold starts.
  output: "export",
  // /ask -> /ask/index.html, which every static host serves without extra rules.
  trailingSlash: true,
};

export default nextConfig;
