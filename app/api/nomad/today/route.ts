import postgres from "postgres"
import { NextResponse } from "next/server"

const AUTH_TOKEN = "nomad-api-secret-2026"

// Un seul client pour tout le processus. L'ancienne version appelait `postgres(url)`
// a chaque requete sans jamais fermer le client : une piscine de connexions neuve
// par appel, qui s'accumulait jusqu'a saturation.
let client: ReturnType<typeof postgres> | null = null
function getSql() {
	if (!client) {
		const url = process.env.POSTGRES_URL
		if (!url) throw new Error("POSTGRES_URL not set")
		client = postgres(url, { max: 5 })
	}
	return client
}

function dateValide(d: unknown): d is string {
	return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
}

// GET /api/nomad/today?date=2026-07-28
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	if (searchParams.get("token") !== AUTH_TOKEN) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const demande = searchParams.get("date")
	const date = dateValide(demande)
		? demande
		: new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date())

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
export async function POST(request: Request) {
	let body: any
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
	}

	if (body?.token !== AUTH_TOKEN) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}
	if (!dateValide(body?.date)) {
		return NextResponse.json({ error: "date attendue au format AAAA-MM-JJ" }, { status: 400 })
	}
	if (!Array.isArray(body?.property_ids) || body.property_ids.some((i: unknown) => typeof i !== "string")) {
		return NextResponse.json({ error: "property_ids attendu comme liste d'identifiants" }, { status: 400 })
	}

	const date: string = body.date
	const ids: string[] = Array.from(new Set(body.property_ids))

	const sql = getSql()

	// En UNE transaction. L'ancienne version supprimait la journee puis inserait
	// identifiant par identifiant : le moindre echec en cours de boucle laissait la
	// journee videe et rien dedans. Perte seche, et l'API renvoyait 500 sans que
	// l'appli le montre.
	let ignores: string[] = []
	await sql.begin(async (tx) => {
		await tx`DELETE FROM cleaning_schedule WHERE date = ${date}::date`

		if (ids.length > 0) {
			// On n'insere que les identifiants qui existent reellement. Un identifiant
			// perime garde dans le navigateur faisait echouer la cle etrangere et
			// annulait l'enregistrement de TOUTE la journee.
			const existants = await tx`
        SELECT id FROM properties WHERE id = ANY(${ids}::text[])
      `
			const valides = existants.map((r: any) => r.id as string)
			ignores = ids.filter((i) => !valides.includes(i))

			if (valides.length > 0) {
				await tx`
          INSERT INTO cleaning_schedule (date, property_id)
          SELECT ${date}::date, unnest(${valides}::text[])
          ON CONFLICT DO NOTHING
        `
			}
		}
	})

	// Relu depuis la base : on ne renvoie pas ce qu'on croit avoir ecrit, mais ce
	// qui y est. C'est ce que l'appli affichera.
	const enregistres = await sql`
    SELECT property_id FROM cleaning_schedule WHERE date = ${date}::date
  `

	return NextResponse.json({
		ok: true,
		date,
		count: enregistres.length,
		property_ids: enregistres.map((r: any) => r.property_id),
		ignores
	})
}