"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { findNearestStation, distanceMeters } from "@/data/vls-stations"
import { findNearestMetro } from "@/data/metro"
import { findNearestBusStops } from "@/data/bus-stops"
import { useToast } from "@/hooks/use-toast"
import { updateKeyboxCode } from "@/lib/properties"
import { Bike, Bus, ExternalLink, Key, MapPin, MessageSquare, Navigation, Pencil, TrainFront } from "lucide-react"
import { useMemo, useState } from "react"
import { TransitTimes } from "./TransitTimes"

interface PropertyInfoCardProps {
	propertyId: string
	address: string | null
	locationTitle: string
	pricePerNight: number
	keyboxCode: string | null
	lat?: number
	lng?: number
	driveUrl?: string | null
	comment?: string | null
}

export function PropertyInfoCard({
	propertyId, address, locationTitle, pricePerNight,
	keyboxCode: initialKeyboxCode, lat, lng, driveUrl, comment
}: PropertyInfoCardProps) {
	const [keyboxCode, setKeyboxCode] = useState(initialKeyboxCode ?? "")
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const { toast } = useToast()

	const fullAddress = address || locationTitle
	const appleMapsUrl = `https://maps.apple.com/?daddr=${encodeURIComponent(fullAddress)}`

	const transport = useMemo(() => {
		if (!lat || !lng) return null
		const vls = findNearestStation(lat, lng)
		const vlsDist = Math.round(distanceMeters(lat, lng, vls.lat, vls.lng))
		const metro = findNearestMetro(lat, lng)
		const bus = findNearestBusStops(lat, lng, 3)
		return { vls: { ...vls, dist: vlsDist }, metro, bus }
	}, [lat, lng])

	const handleSaveKeyboxCode = async () => {
		setIsSaving(true)
		try {
			await updateKeyboxCode(propertyId, keyboxCode)
			setIsEditing(false)
			toast({ title: "Code enregistré" })
		} catch {
			toast({ title: "Erreur", variant: "destructive" })
		} finally {
			setIsSaving(false)
		}
	}

	const lineColor = (line: string) => {
		if (line === "a") return "#e4003a"
		if (line === "b") return "#00893e"
		return "#7c3aed"
	}

	const lineLabel = (line: string) => {
		if (line === "ab") return "A/B"
		return line.toUpperCase()
	}

	return (
		<div className="col-span-1">
			<Card className="sticky top-24">
				<CardContent className="p-6 space-y-5">
					<div className="flex items-baseline gap-1">
						<span className="text-2xl font-bold">{pricePerNight}€</span>
						<span className="text-gray-500">prestation</span>
					</div>

					<div className="space-y-3">
						<div className="flex items-start gap-2 text-sm text-gray-700">
							<MapPin className="h-4 w-4 mt-0.5 shrink-0" />
							<span>{fullAddress}</span>
						</div>
						<a href={appleMapsUrl} target="_blank" rel="noopener noreferrer">
							<Button className="w-full gap-2 mt-2" variant="outline">
								<Navigation className="h-4 w-4" />
								Itinéraire Apple Plans
							</Button>
						</a>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-sm font-medium">
								<Key className="h-4 w-4" />
								Boîte à clef
							</div>
							{!isEditing && (
								<Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
									<Pencil className="h-3 w-3" />
								</Button>
							)}
						</div>
						{isEditing ? (
							<div className="flex gap-2">
								<Input value={keyboxCode} onChange={(e) => setKeyboxCode(e.target.value)} placeholder="Ex: 1234" />
								<Button onClick={handleSaveKeyboxCode} disabled={isSaving} size="sm">{isSaving ? "..." : "OK"}</Button>
								<Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Annuler</Button>
							</div>
						) : (
							<div className="text-lg font-mono font-bold tracking-widest bg-gray-50 rounded-md px-4 py-3 text-center">
								{keyboxCode || "Non configuré"}
							</div>
						)}
					</div>

					{comment && (
						<div className="flex items-start gap-2 text-sm rounded-lg bg-amber-50 p-3">
							<MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
							<span className="text-amber-800">{comment}</span>
						</div>
					)}

					{driveUrl && (
						<a href={driveUrl} target="_blank" rel="noopener noreferrer" className="block pt-2">
							<Button className="w-full gap-2" variant="outline" size="sm">
								<ExternalLink className="h-3.5 w-3.5" />
								Document PDF
							</Button>
						</a>
					)}

					{transport && (
						<div className="space-y-2">
							<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transports</div>

							<div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50">
								<TrainFront className="h-4 w-4 shrink-0" style={{ color: lineColor(transport.metro.station.line) }} />
								<span
									className="text-xs font-bold text-white px-1.5 py-0.5 rounded"
									style={{ backgroundColor: lineColor(transport.metro.station.line) }}
								>
									{lineLabel(transport.metro.station.line)}
								</span>
								<span className="text-sm">{transport.metro.station.name}</span>
								<span className="text-xs text-muted-foreground ml-auto">{transport.metro.dist}m</span>
							</div>

							<div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-green-50">
								<Bike className="h-4 w-4 shrink-0 text-green-600" />
								<span className="text-sm text-green-800">{transport.vls.name}</span>
								<span className="text-xs text-green-600 ml-auto">{transport.vls.dist}m · {transport.vls.spots} places</span>
							</div>

							{transport.bus.map(({ stop, dist }) => (
								<div key={stop.name + dist} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-blue-50">
									<Bus className="h-4 w-4 shrink-0 text-blue-600" />
									<span className="text-sm text-blue-800">{stop.name}</span>
									<span className="text-xs text-blue-600 ml-auto">{dist}m</span>
								</div>
							))}

							<TransitTimes
								metroStop={transport.metro.station.name}
								busStops={transport.bus.map(b => b.stop.name)}
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
