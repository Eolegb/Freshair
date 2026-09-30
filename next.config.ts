import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	// Necessaire pour le Dockerfile : produit .next/standalone avec un server.js
	// autonome, sans avoir besoin de node_modules dans l'image finale.
	output: "standalone",
	images: {
		remotePatterns: [
			{ hostname: "a0.muscache.com" },
			{ hostname: "supermanager-img.s3.amazonaws.com" }
		]
	}
}

export default nextConfig