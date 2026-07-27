import { NextResponse } from "next/server"

const STAR_BASE = "https://data.explore.star.fr/api/explore/v2.1/catalog/datasets"
const API_KEY = process.env.STAR_API_KEY || ""

async function fetchStar(dataset: string, stopName: string, limit = 8) {
	const where = encodeURIComponent("nomarret='" + stopName.replace(/'/g, "\\'") + "'")
	const url = STAR_BASE + "/" + dataset + "/records?where=" + where + "&order_by=depart&limit=" + limit
	const res = await fetch(url, {
		headers: { Authorization: "Apikey " + API_KEY },
		next: { revalidate: 0 }
	})
	if (!res.ok) return []
	const data = await res.json()
	return data.results || []
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const metroStop = searchParams.get("metro")
	const busStops = searchParams.get("bus")

	const now = Date.now()

	type Arrival = { line: string; destination: string; minutes: number; realtime: boolean }
	const results: { metro: Arrival[]; bus: Arrival[] } = { metro: [], bus: [] }

	if (metroStop) {
		const records = await fetchStar("tco-metro-circulation-passages-tr", metroStop, 10)
		const seen = new Set<string>()
		for (const r of records) {
			const dep = new Date(r.depart).getTime()
			const minutes = Math.round((dep - now) / 60000)
			if (minutes < 0) continue
			const key = r.nomcourtligne + "|" + r.destination + "|" + minutes
			if (seen.has(key)) continue
			seen.add(key)
			results.metro.push({
				line: r.nomcourtligne,
				destination: r.destination,
				minutes,
				realtime: (Array.isArray(r.precision) ? r.precision[0] : r.precision) === "Temps réel"
			})
		}
		results.metro.sort((a, b) => a.minutes - b.minutes)
		results.metro = results.metro.slice(0, 4)
	}

	if (busStops) {
		const stops = busStops.split(",").slice(0, 3)
		const seen = new Set<string>()
		for (const stop of stops) {
			const records = await fetchStar("tco-bus-circulation-passages-tr", stop.trim(), 4)
		for (const r of records) {
			const dep = new Date(r.depart || r.departtheorique).getTime()
			const minutes = Math.round((dep - now) / 60000)
			if (minutes < 0) continue
			if (r.nomcourtligne?.startsWith("N")) continue
			const key = r.nomcourtligne + "|" + r.destination + "|" + minutes
				if (seen.has(key)) continue
				seen.add(key)
				results.bus.push({
					line: r.nomcourtligne,
					destination: r.destination,
					minutes,
					realtime: r.precision === "Temps réel"
				})
			}
		}
		results.bus.sort((a, b) => a.minutes - b.minutes)
		results.bus = results.bus.slice(0, 4)
	}

	return NextResponse.json(results, {
		headers: { "Cache-Control": "no-cache, no-store, max-age=0" }
	})
}
