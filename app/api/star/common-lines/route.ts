import { busLineColors } from "@/data/bus-lines"
import { findNearestBusStops } from "@/data/bus-stops"
import { NextResponse } from "next/server"

const STAR_BASE = "https://data.explore.star.fr/api/explore/v2.1/catalog/datasets"
const API_KEY = process.env.STAR_API_KEY || ""

async function fetchStar(dataset: string, where: string, select: string, limit = 20) {
	const url = STAR_BASE + "/" + dataset + "/records?where=" + encodeURIComponent(where) + "&select=" + encodeURIComponent(select) + "&limit=" + limit
	const res = await fetch(url, { headers: { Authorization: "Apikey " + API_KEY }, next: { revalidate: 300 } })
	if (!res.ok) return []
	const data = await res.json()
	return data.results || []
}

async function getLinesForStops(stopNames: string[]): Promise<string[]> {
	const lines = new Set<string>()
	for (const stop of stopNames.slice(0, 3)) {
		const arrivals = await fetchStar(
			"tco-bus-circulation-passages-tr",
			"nomarret='" + stop.replace(/'/g, "\\'") + "'",
			"nomcourtligne", 15
		)
		for (const a of arrivals) {
			if (a.nomcourtligne && !a.nomcourtligne.startsWith("N")) lines.add(a.nomcourtligne)
		}
	}
	return [...lines]
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const propsParam = searchParams.get("props")
	if (!propsParam) return NextResponse.json({ commonLines: [], routes: [] })

	const props = propsParam.split("|").map(p => {
		const [lat, lng] = p.split(",").map(Number)
		return { lat, lng }
	}).filter(p => !isNaN(p.lat) && !isNaN(p.lng))

	if (props.length < 2) return NextResponse.json({ commonLines: [], routes: [] })

	const propLines: string[][] = []
	const allStopNames = new Set<string>()

	for (const p of props) {
		const stops = findNearestBusStops(p.lat, p.lng, 3)
		const stopNames = stops.map(s => s.stop.name)
		stopNames.forEach(n => allStopNames.add(n))
		const lines = await getLinesForStops(stopNames)
		propLines.push(lines)
	}

	const lineCounts: Record<string, number> = {}
	for (const lines of propLines) {
		for (const l of lines) {
			lineCounts[l] = (lineCounts[l] || 0) + 1
		}
	}

	const common = Object.entries(lineCounts)
		.filter(([, count]) => count >= 2)
		.map(([line]) => line)
		.sort()

	if (common.length === 0) return NextResponse.json({ commonLines: [], routes: [] })

	const lineFilter = common.map(l => "nomcourtligne='" + l + "'").join(" OR ")
	const parcours = await fetchStar(
		"tco-bus-topologie-parcours-td",
		"(" + lineFilter + ") AND type='Principal' AND estversionactive='Oui'",
		"nomcourtligne,parcours,libellelong,senscommercial", 40
	)

	const routes: { line: string; color: string; direction: string; from: string; to: string; coordinates: number[][] }[] = []
	const seen = new Set<string>()
	for (const p of parcours) {
		if (!p.parcours?.geometry?.coordinates) continue
		const key = p.nomcourtligne + "|" + p.senscommercial
		if (seen.has(key)) continue
		seen.add(key)
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

	const commonLines = common.map(l => ({
		line: l,
		color: busLineColors[l] || "#3b82f6",
		servedBy: lineCounts[l],
		terminus: routes.find(r => r.line === l)?.to || ""
	}))

	return NextResponse.json({ commonLines, routes }, {
		headers: { "Cache-Control": "public, max-age=300" }
	})
}
