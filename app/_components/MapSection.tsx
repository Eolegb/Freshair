"use client"

import { vlsStations } from "@/data/vls-stations"
import { distanceMeters } from "@/data/vls-stations"
import { metroLineA, metroLineB } from "@/data/metro"
import { findNearestBusStops } from "@/data/bus-stops"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef } from "react"

const OFFICE = { lat: 48.108102, lng: -1.686451 }

interface MapSectionProps {
	coordinates: {
		latitude: number
		longitude: number
	}
}

function addMetroLines(map: mapboxgl.Map) {
	const lineACoords = metroLineA.map(s => [s.lng, s.lat] as [number, number])
	const lineBCoords = metroLineB.map(s => [s.lng, s.lat] as [number, number])

	map.addSource("metro-a", {
		type: "geojson",
		data: { type: "Feature", geometry: { type: "LineString", coordinates: lineACoords }, properties: {} }
	})
	map.addLayer({
		id: "metro-a-line", type: "line", source: "metro-a",
		paint: { "line-color": "#e4003a", "line-width": 2.5, "line-opacity": 0.4 }
	})
	map.addSource("metro-b", {
		type: "geojson",
		data: { type: "Feature", geometry: { type: "LineString", coordinates: lineBCoords }, properties: {} }
	})
	map.addLayer({
		id: "metro-b-line", type: "line", source: "metro-b",
		paint: { "line-color": "#00893e", "line-width": 2.5, "line-opacity": 0.4 }
	})

	for (const s of metroLineA) {
		const c = s.line === "ab" ? "#7c3aed" : "#e4003a"
		const label = s.line === "ab" ? "A+B" : "A"
		const el = document.createElement("div")
		el.style.cssText = "width:10px;height:10px;background:" + c + ";border-radius:50%;border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:pointer"
		new mapboxgl.Marker({ element: el }).setLngLat([s.lng, s.lat])
			.setPopup(new mapboxgl.Popup({ offset: 10, maxWidth: "200px" }).setHTML("<div style='font-family:system-ui;font-size:12px'><span style='background:" + c + ";color:white;padding:1px 5px;border-radius:3px;font-weight:700;font-size:10px'>" + label + "</span> <b>" + s.name + "</b></div>"))
			.addTo(map)
	}
	for (const s of metroLineB) {
		if (s.line === "ab") continue
		const el = document.createElement("div")
		el.style.cssText = "width:10px;height:10px;background:#00893e;border-radius:50%;border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:pointer"
		new mapboxgl.Marker({ element: el }).setLngLat([s.lng, s.lat])
			.setPopup(new mapboxgl.Popup({ offset: 10, maxWidth: "200px" }).setHTML("<div style='font-family:system-ui;font-size:12px'><span style='background:#00893e;color:white;padding:1px 5px;border-radius:3px;font-weight:700;font-size:10px'>B</span> <b>" + s.name + "</b></div>"))
			.addTo(map)
	}
}

async function addBusRoutes(map: mapboxgl.Map, lat: number, lng: number) {
	const nearBus = findNearestBusStops(lat, lng, 3)
	const stopNames = nearBus.map(b => b.stop.name)
	if (!stopNames.length) return

	try {
		const res = await fetch("/api/star/routes?stops=" + encodeURIComponent(stopNames.join(",")))
		if (!res.ok) return
		const { routes } = await res.json()

		for (let i = 0; i < routes.length; i++) {
			const r = routes[i]
			const srcId = "bus-route-" + i
			if (map.getSource(srcId)) continue
			map.addSource(srcId, {
				type: "geojson",
				data: { type: "Feature", geometry: { type: "LineString", coordinates: r.coordinates }, properties: {} }
			})
			map.addLayer({
				id: srcId + "-line", type: "line", source: srcId,
				paint: { "line-color": r.color, "line-width": 4, "line-opacity": 0.6 }
			})
		}

		for (const { stop, dist } of nearBus) {
			const linesHere = routes
				.filter((r: any) => r.from.includes(stop.name) || r.to.includes(stop.name) || true)
				.map((r: any) => "<span style='background:" + r.color + ";color:white;padding:1px 4px;border-radius:3px;font-size:10px;font-weight:700'>" + r.line + "</span>")
			const uniqueLines = [...new Set(linesHere)].slice(0, 4)

			const el = document.createElement("div")
			el.style.cssText = "width:12px;height:12px;background:#3b82f6;border-radius:50%;border:1.5px solid white;box-shadow:0 1px 2px rgba(0,0,0,.2);cursor:pointer"
			const popupHtml = "<div style='font-family:system-ui;font-size:12px'><b>🚌 " + stop.name + "</b><div style='color:#666;font-size:11px'>" + dist + "m</div>" + (uniqueLines.length ? "<div style='margin-top:4px;display:flex;gap:3px;flex-wrap:wrap'>" + uniqueLines.join("") + "</div>" : "") + "</div>"
			new mapboxgl.Marker({ element: el }).setLngLat([stop.lng, stop.lat])
				.setPopup(new mapboxgl.Popup({ offset: 8, maxWidth: "220px" }).setHTML(popupHtml))
				.addTo(map)
		}

		const legend = routes.reduce((acc: any[], r: any) => {
			if (!acc.find((a: any) => a.line === r.line)) acc.push(r)
			return acc
		}, [])

		if (legend.length > 0) {
			const legendDiv = document.createElement("div")
			legendDiv.style.cssText = "position:absolute;bottom:8px;left:8px;background:white;border-radius:8px;padding:6px 10px;font-family:system-ui;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:1;max-width:220px"
			legendDiv.innerHTML = legend.map((r: any) =>
				"<div style='display:flex;align-items:center;gap:6px;margin:2px 0'><span style='background:" + r.color + ";color:white;padding:1px 5px;border-radius:3px;font-weight:700;font-size:10px'>" + r.line + "</span><span style='color:#666;font-size:10px'>→ " + r.to + "</span></div>"
			).join("")
			map.getContainer().appendChild(legendDiv)
		}
	} catch {}
}

export function MapSection({ coordinates }: MapSectionProps) {
	const mapContainer = useRef<HTMLDivElement>(null)
	const map = useRef<mapboxgl.Map | null>(null)

	useEffect(() => {
		if (map.current) return
		if (!mapContainer.current) return

		mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

		map.current = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/mapbox/streets-v12",
			center: [coordinates.longitude, coordinates.latitude],
			zoom: 15
		})
		map.current.scrollZoom.disable()

		new mapboxgl.Marker({ color: "#7c3aed" })
			.setLngLat([coordinates.longitude, coordinates.latitude])
			.addTo(map.current)

		map.current.on("load", () => {
			if (!map.current) return

			addMetroLines(map.current)

			const officeEl = document.createElement("div")
			officeEl.style.cssText = "width:30px;height:30px;border-radius:50%;overflow:hidden;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer"
			officeEl.innerHTML = "<img src='/Nomadcercle-kaki.png' style='width:100%;height:100%;object-fit:cover' />"
			new mapboxgl.Marker({ element: officeEl }).setLngLat([OFFICE.lng, OFFICE.lat])
				.setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML("<div style='font-family:system-ui;font-size:12px'><b>Bureau Nomad</b><div style='color:#666;font-size:11px'>13 rue de la Santé</div></div>"))
				.addTo(map.current!)

			const nearVls = vlsStations.filter(s => distanceMeters(coordinates.latitude, coordinates.longitude, s.lat, s.lng) < 500)
			for (const s of nearVls) {
				const el = document.createElement("div")
				el.style.cssText = "width:14px;height:14px;background:#16a34a;border-radius:50%;border:1.5px solid white;display:flex;align-items:center;justify-content:center;font-size:8px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.2)"
				el.textContent = "🚲"
				new mapboxgl.Marker({ element: el }).setLngLat([s.lng, s.lat])
					.setPopup(new mapboxgl.Popup({ offset: 10, maxWidth: "180px" }).setHTML("<div style='font-family:system-ui;font-size:12px'><b>🚲 " + s.name + "</b><div style='color:#666;font-size:11px'>" + s.spots + " emplacements</div></div>"))
					.addTo(map.current!)
			}

			addBusRoutes(map.current!, coordinates.latitude, coordinates.longitude)
		})

		return () => { map.current?.remove() }
	}, [coordinates])

	return (
		<div ref={mapContainer} className="mt-4 rounded-lg overflow-hidden h-[300px] w-full bg-muted relative" />
	)
}
