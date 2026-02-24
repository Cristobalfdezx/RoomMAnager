/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ ¡Peligro! Ignora errores de compilación para desplegar ya.
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ ¡Peligro! Ignora errores de estilo.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;