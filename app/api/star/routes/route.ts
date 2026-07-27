import { busLineColors } from "@/data/bus-lines"
import { NextResponse } from "next/server"

const STAR_BASE = "https://data.explore.star.fr/api/explore/v2.1/catalog/datasets"
const API_KEY = process.env.STAR_API_KEY || ""

async function fetchStar(dataset: string, where: string, select: string, limit = 10) {
	const url = STAR_BASE + "/" + dataset + "/records?where=" + encodeURIComponent(where) + "&select=" + encodeURIComponent(select) + "&limit=" + limit
	const res = await fetch(url, { headers: { Authorization: "Apikey " + API_KEY }, next: { revalidate: 300 } })
	if (!res.ok) return []
	const data = await res.json()
	return data.results || []
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const stopsParam = searchParams.get("stops")
	if (!stopsParam) return NextResponse.json({ routes: [] })

	const stops = stopsParam.split(",").map(s => s.trim()).slice(0, 5)

	const lineNames = new Set<string>()
	for (const stop of stops) {
		const arrivals = await fetchStar(
			"tco-bus-circulation-passages-tr",
			"nomarret='" + stop.replace(/'/g, "\\'") + "'",
			"nomcourtligne", 20
		)
		for (const a of arrivals) {
			if (a.nomcourtligne && !a.nomcourtligne.startsWith("N")) lineNames.add(a.nomcourtligne)
		}
	}

	if (lineNames.size === 0) return NextResponse.json({ routes: [] })

	const lineFilter = [...lineNames].map(l => "nomcourtligne='" + l + "'").join(" OR ")
	const parcours = await fetchStar(
		"tco-bus-topologie-parcours-td",
		"(" + lineFilter + ") AND type='Principal' AND estversionactive='Oui'",
		"nomcourtligne,parcours,libellelong,senscommercial", 30
	)

	const routes = []
	const seenLines = new Set<string>()
	for (const p of parcours) {
		if (!p.parcours?.geometry?.coordinates) continue
		const key = p.nomcourtligne + "|" + p.senscommercial
		if (seenLines.has(key)) continue
		seenLines.add(key)

		const parts = (p.libellelong || "").split(" -> ")
		routes.push({
			line: p.nomcourtligne,
			color: busLineColors[p.nomcourtligne] || "#3b82f6",
			direction: p.senscommercial === "Aller" ? "aller" : "retour",
			from: parts[0]?.trim() || "",
			to: parts[parts.length - 1]?.trim() || "",
			coordinates: p.parcours.geometry.coordinates
		})
	}

	return NextResponse.json({ routes }, {
		headers: { "Cache-Control": "public, max-age=300" }
	})
}
