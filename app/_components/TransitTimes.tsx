"use client"

import { Bus, TrainFront } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface Arrival {
	line: string
	destination: string
	minutes: number
	realtime: boolean
}

interface TransitTimesProps {
	metroStop: string
	busStops: string[]
}

export function TransitTimes({ metroStop, busStops }: TransitTimesProps) {
	const [data, setData] = useState<{ metro: Arrival[]; bus: Arrival[] } | null>(null)

	const fetchArrivals = useCallback(async () => {
		try {
			const params = new URLSearchParams()
			if (metroStop) params.set("metro", metroStop)
			if (busStops.length) params.set("bus", busStops.join(","))
			const res = await fetch("/api/star/arrivals?" + params.toString())
			if (res.ok) setData(await res.json())
		} catch {}
	}, [metroStop, busStops])

	useEffect(() => {
		fetchArrivals()
		const interval = setInterval(fetchArrivals, 30000)
		return () => clearInterval(interval)
	}, [fetchArrivals])

	if (!data) return null
	if (!data.metro.length && !data.bus.length) return null

	const lineColor = (line: string) => {
		if (line === "a") return "#e4003a"
		if (line === "b") return "#00893e"
		return "#3b82f6"
	}

	return (
		<div className="space-y-2 pt-1">
			<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				Prochains passages
				<span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-1.5 animate-pulse" />
			</div>

			{data.metro.length > 0 && (
				<div className="space-y-1">
					{data.metro.map((a, i) => (
						<div key={"m" + i} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md bg-gray-50">
							<TrainFront className="h-3.5 w-3.5 shrink-0" style={{ color: lineColor(a.line) }} />
							<span
								className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded leading-none"
								style={{ backgroundColor: lineColor(a.line) }}
							>
								{a.line.toUpperCase()}
							</span>
							<span className="text-gray-500">→</span>
							<span className="truncate">{a.destination}</span>
							<span className="ml-auto font-bold whitespace-nowrap tabular-nums" style={{ color: lineColor(a.line) }}>
								{a.minutes === 0 ? "⬤ now" : a.minutes + " min"}
							</span>
						</div>
					))}
				</div>
			)}

			{data.bus.length > 0 && (
				<div className="space-y-1">
					{data.bus.map((a, i) => (
						<div key={"b" + i} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md bg-gray-50">
							<Bus className="h-3.5 w-3.5 shrink-0 text-blue-600" />
							<span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded leading-none">
								{a.line}
							</span>
							<span className="text-gray-500">→</span>
							<span className="truncate">{a.destination}</span>
							<span className="ml-auto font-bold text-blue-600 whitespace-nowrap tabular-nums">
								{a.minutes === 0 ? "⬤ now" : a.minutes + " min"}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
