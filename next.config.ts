import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ hostname: "a0.muscache.com" },
			{ hostname: "supermanager-img.s3.amazonaws.com" }
		]
	}
}

export default nextConfig
