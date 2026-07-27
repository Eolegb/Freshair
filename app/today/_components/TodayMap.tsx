"use client"

import type { TodayProperty } from "@/lib/properties"
import { vlsStations, distanceMeters } from "@/data/vls-stations"
import { findNearestBusStops } from "@/data/bus-stops"
import { metroLineA, metroLineB } from "@/data/metro"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef } from "react"

export function TodayMap({ selected }: { selected: TodayProperty[] }) {
	const mapContainer = useRef<HTMLDivElement>(null)
	const map = useRef<mapboxgl.Map | null>(null)
	const markersRef = useRef<mapboxgl.Marker[]>([])
	const vlsMarkersRef = useRef<mapboxgl.Marker[]>([])

	useEffect(() => {
		if (!mapContainer.current) return

		mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

		if (!map.current) {
			map.current = new mapboxgl.Map({
				container: mapContainer.current,
				style: "mapbox://styles/mapbox/streets-v12",
				center: [-1.6778, 48.1173],
				zoom: 12
			})
			map.current.scrollZoom.enable()

			map.current.on("load", () => {
				if (!map.current) return
				const lineACoords = metroLineA.map(s => [s.lng, s.lat] as [number, number])
				const lineBCoords = metroLineB.map(s => [s.lng, s.lat] as [number, number])
				map.current.addSource("metro-a", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: lineACoords }, properties: {} } })
				map.current.addLayer({ id: "metro-a-line", type: "line", source: "metro-a", paint: { "line-color": "#e4003a", "line-width": 3, "line-opacity": 0.5 } })
				map.current.addSource("metro-b", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: lineBCoords }, properties: {} } })
				map.current.addLayer({ id: "metro-b-line", type: "line", source: "metro-b", paint: { "line-color": "#00893e", "line-width": 3, "line-opacity": 0.5 } })
				for (const s of [...metroLineA, ...metroLineB.filter(x => x.line !== "ab")]) {
					const color = s.line === "a" || s.line === "ab" ? "#e4003a" : "#00893e"
					const el = document.createElement("div")
					el.style.cssText = "width:8px;height:8px;background:" + color + ";border-radius:50%;border:1px solid white;box-shadow:0 1px 2px rgba(0,0,0,.3)"
					new mapboxgl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map.current!)
				}
			})
		}

		for (const m of markersRef.current) m.remove()
		markersRef.current = []
		for (const m of vlsMarkersRef.current) m.remove()
		vlsMarkersRef.current = []

		const officeEl = document.createElement("div")
		officeEl.style.cssText = "width:30px;height:30px;border-radius:50%;overflow:hidden;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer"
		officeEl.innerHTML = "<img src='/Nomadcercle-kaki.png' style='width:100%;height:100%;object-fit:cover' />"
		const officeMk = new mapboxgl.Marker({ element: officeEl })
			.setLngLat([-1.686451, 48.108102])
			.setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML("<div style='font-family:system-ui;font-size:12px'><b>Bureau Nomad</b><div style='color:#666;font-size:11px'>13 rue de la Santé</div></div>"))
			.addTo(map.current!)
		vlsMarkersRef.current.push(officeMk)

		const nearVls = vlsStations.filter(s =>
			selected.some(p => distanceMeters(p.lat, p.lng, s.lat, s.lng) < 600)
		)
		for (const s of nearVls) {
			const el = document.createElement("div")
			el.style.cssText = "width:16px;height:16px;background:#16a34a;border-radius:50%;border:1.5px solid white;display:flex;align-items:center;justify-content:center;font-size:9px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.2)"
			el.textContent = "🚲"
			const marker = new mapboxgl.Marker({ element: el })
				.setLngLat([s.lng, s.lat])
				.setPopup(new mapboxgl.Popup({ offset: 10 }).setHTML("<div style='font-family:system-ui;font-size:12px'><b>🚲 " + s.name + "</b><div style='color:#666;font-size:11px'>" + s.spots + " places</div></div>"))
				.addTo(map.current!)
			vlsMarkersRef.current.push(marker)
		}

		const nearBusStops = new Map<string, { lat: number; lng: number }>()
		for (const p of selected) {
			const stops = findNearestBusStops(p.lat, p.lng, 3)
			for (const { stop } of stops) {
				nearBusStops.set(stop.name, { lat: stop.lat, lng: stop.lng })
			}
		}
		for (const [name, coords] of nearBusStops) {
			const el = document.createElement("div")
			el.style.cssText = "width:10px;height:10px;background:#3b82f6;border-radius:50%;border:1.5px solid white;box-shadow:0 1px 2px rgba(0,0,0,.2);cursor:pointer"
			const marker = new mapboxgl.Marker({ element: el })
				.setLngLat([coords.lng, coords.lat])
				.setPopup(new mapboxgl.Popup({ offset: 8 }).setHTML("<div style='font-family:system-ui;font-size:12px'><b>🚌 " + name + "</b></div>"))
				.addTo(map.current!)
			vlsMarkersRef.current.push(marker)
		}

		for (const p of selected) {
			const popup = new mapboxgl.Popup({ offset: 25, maxWidth: "220px" }).setHTML(
				"<div style='font-family:system-ui'><b style='font-size:13px'>" + p.title + "</b>" +
				(p.keyboxCode ? "<div style='font-size:18px;font-weight:bold;font-family:monospace;margin-top:4px;letter-spacing:2px'>🔑 " + p.keyboxCode + "</div>" : "") +
				(p.address ? "<div style='font-size:11px;color:#666;margin-top:4px'>" + p.address + "</div>" : "") +
				"</div>"
			)
			const marker = new mapboxgl.Marker({ color: "#2563eb" })
				.setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map.current!)
			markersRef.current.push(marker)
		}

		if (selected.length > 0) {
			const bounds = new mapboxgl.LngLatBounds()
			for (const p of selected) bounds.extend([p.lng, p.lat])
			map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 })
		}
	}, [selected])

	return (
		<div ref={mapContainer} className="w-full flex-shrink-0" style={{ height: "40%" }} />
	)
}
