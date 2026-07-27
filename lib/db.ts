import "server-only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

let _db: ReturnType<typeof drizzle> | null = null

function getDb() {
	if (!_db) {
		const connectionString = process.env.POSTGRES_URL
		if (!connectionString) throw new Error("POSTGRES_URL is not set")
		const queryClient = postgres(connectionString)
		_db = drizzle(queryClient)
	}
	return _db
}

const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get(_, prop) {
		return (getDb() as any)[prop]
	}
})

export { db }
