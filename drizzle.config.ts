import "dotenv/config"
import { defineConfig } from "drizzle-kit"

if (!process.env.POSTGRES_URL_NON_POOLING) {
	throw new Error("POSTGRES_URL_NON_POOLING is not set")
}

export default defineConfig({
	out: "./drizzle",
	schema: "./db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.POSTGRES_URL_NON_POOLING,
		ssl: true
	}
})
