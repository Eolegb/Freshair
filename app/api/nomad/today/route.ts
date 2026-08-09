import { NextResponse } from "next/server"
import postgres from "postgres"

const AUTH_TOKEN = "nomad-api-secret-2026"

// YYYY-MM-DD, matches the string produced by `date.toISOString().split("T")[0]` on the client
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function getSql() {
	const url = process.env.POSTGRES_URL
	if (!url) throw new Error("POSTGRES_URL not set")
	return postgres(url)
}

// GET /api/nomad/today?date=2026-07-28
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	if (searchParams.get("token") !== AUTH_TOKEN)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

	const date =
		searchParams.get("date") || new Date().toISOString().split("T")[0]
	if (!DATE_RE.test(date))
		return NextResponse.json({ error: "Invalid date" }, { status: 400 })

	const sql = getSql()

	const rows = await sql`
    SELECT p.id, (p.listing_data::json->'data'->>'h1Title') as title, p.cleaning_price
    FROM cleaning_schedule cs
    JOIN properties p ON cs.property_id = p.id
    WHERE cs.date = ${date}::date
    ORDER BY p.cleaning_price DESC
  `

	return NextResponse.json({ date, prestations: rows })
}

// POST /api/nomad/today
// Body: { token, date: "YYYY-MM-DD", property_ids: string[] }
// Syncs the schedule for that day to exactly match property_ids — adds what's
// missing, removes what's no longer selected — instead of deleting the whole
// day and reinserting, so two concurrent saves for the same date can't clobber
// each other's rows in between the delete and the reinsert.
export async function POST(request: Request) {
	let body: unknown
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
	}

	if (typeof body !== "object" || body === null) {
		return NextResponse.json({ error: "Invalid body" }, { status: 400 })
	}

	const { token, date, property_ids } = body as Record<string, unknown>

	if (token !== AUTH_TOKEN)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	if (typeof date !== "string" || !DATE_RE.test(date)) {
		return NextResponse.json(
			{ error: "Invalid or missing date" },
			{ status: 400 }
		)
	}
	if (
		!Array.isArray(property_ids) ||
		!property_ids.every((id) => typeof id === "string")
	) {
		return NextResponse.json(
			{ error: "property_ids must be an array of strings" },
			{ status: 400 }
		)
	}

	// De-dupe defensively — the client shouldn't send duplicates, but the unique
	// index would reject a batch insert containing the same id twice.
	const ids = Array.from(new Set(property_ids))

	const sql = getSql()

	await sql.begin(async (tx) => {
		if (ids.length > 0) {
			const values = ids.map((propertyId) => ({
				id: crypto.randomUUID(),
				date,
				propertyId
			}))
			await tx`
        INSERT INTO cleaning_schedule ${tx(values, "id", "date", "propertyId")}
        ON CONFLICT (date, property_id) DO NOTHING
      `
			await tx`
        DELETE FROM cleaning_schedule
        WHERE date = ${date}::date
          AND property_id NOT IN ${tx(ids)}
      `
		} else {
			await tx`DELETE FROM cleaning_schedule WHERE date = ${date}::date`
		}
	})

	return NextResponse.json({ ok: true, count: ids.length })
}
