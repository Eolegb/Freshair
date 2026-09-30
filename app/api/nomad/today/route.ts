import { NextResponse } from "next/server"
import postgres from "postgres"

const AUTH_TOKEN = "nomad-api-secret-2026"

// AAAA-MM-JJ, format produit par le client.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// UN SEUL client pour tout le processus. L'ancienne version appelait
// `postgres(url)` a chaque requete sans jamais fermer : une piscine de connexions
// neuve par appel, qui s'accumulait jusqu'a saturation.
let client: ReturnType<typeof postgres> | null = null
function getSql() {
	if (!client) {
		const url = process.env.POSTGRES_URL
		if (!url) throw new Error("POSTGRES_URL not set")
		client = postgres(url, { max: 5 })
	}
	return client
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
// Aligne le planning du jour sur property_ids — ajoute ce qui manque, retire ce
// qui n'est plus selectionne — au lieu de vider la journee puis de tout reinserer,
// pour que deux enregistrements simultanes ne puissent pas s'effacer mutuellement.
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

	// Dedoublonnage defensif : l'index unique rejetterait un lot contenant deux
	// fois le meme identifiant.
	const ids = Array.from(new Set(property_ids))

	const sql = getSql()
	let ignores: string[] = []

	await sql.begin(async (tx) => {
		// On ne travaille que sur des identifiants qui existent reellement.
		// Un identifiant perime garde dans le navigateur faisait echouer la cle
		// etrangere et annulait l'enregistrement de toute la journee.
		let valides: string[] = []
		if (ids.length > 0) {
			const existants = await tx`
        SELECT id FROM properties WHERE id = ANY(${ids}::text[])
      `
			valides = existants.map((r) => r.id as string)
			ignores = ids.filter((i) => !valides.includes(i))
		}

		if (valides.length > 0) {
			// PAS de colonne `id` ici : elle est de type entier avec une sequence
			// (nextval). L'ancienne version y ecrivait un crypto.randomUUID() — une
			// chaine dans une colonne entiere — donc CHAQUE enregistrement echouait.
			// Les cles doivent porter le NOM EXACT de la colonne : l'aide `tx(...)` les
			// recopie telles quelles dans le SQL. `propertyId` produisait
			// « column "propertyId" of relation "cleaning_schedule" does not exist »
			// et faisait echouer chaque enregistrement.
			const values = valides.map((propertyId) => ({ date, property_id: propertyId }))
			await tx`
        INSERT INTO cleaning_schedule ${tx(values, "date", "property_id")}
        ON CONFLICT (date, property_id) DO NOTHING
      `
			await tx`
        DELETE FROM cleaning_schedule
        WHERE date = ${date}::date
          AND property_id NOT IN ${tx(valides)}
      `
		} else {
			await tx`DELETE FROM cleaning_schedule WHERE date = ${date}::date`
		}
	})

	// Relu depuis la base : on ne renvoie pas ce qu'on croit avoir ecrit, mais ce
	// qui y est reellement — c'est ce que l'appli affichera.
	const enregistres = await sql`
    SELECT property_id FROM cleaning_schedule WHERE date = ${date}::date
  `

	return NextResponse.json({
		ok: true,
		count: enregistres.length,
		property_ids: enregistres.map((r) => r.property_id as string),
		ignores
	})
}