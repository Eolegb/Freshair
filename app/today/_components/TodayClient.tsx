"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/components/ui/sheet"
import type { TodayProperty } from "@/lib/properties"
import { Bus, Key, MapPin, Navigation, Plus, Search, X } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

const TodayMap = dynamic(() => import("./TodayMap").then(m => ({ default: m.TodayMap })), {
	ssr: false,
	loading: () => <div className="w-full flex-shrink-0 bg-muted animate-pulse" style={{ height: "40%" }} />
})

const STORAGE_KEY = "freshair_today"

type CommonLine = { line: string; color: string; servedBy: number; terminus: string }

export function TodayClient({ properties }: { properties: TodayProperty[] }) {
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [commonLines, setCommonLines] = useState<CommonLine[]>([])
	const [todayPrestations, setTodayPrestations] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	// Charger les prestations du jour depuis la DB
	useEffect(() => {
		const today = new Date().toISOString().split("T")[0]
		fetch(`/api/nomad/today?date=${today}&token=nomad-api-secret-2026`)
			.then(r => r.json())
			.then(data => {
				if (data.prestations) {
					const ids = data.prestations.map((p: any) => p.id)
					setSelectedIds(ids)
					setTodayPrestations(data.prestations)
					localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
				}
			})
			.catch(() => {
				// Fallback localStorage
				const stored = localStorage.getItem(STORAGE_KEY)
				if (stored) { try { setSelectedIds(JSON.parse(stored)) } catch {} }
			})
			.finally(() => setLoading(false))
	}, [])

	const saveSelection = useCallback((ids: string[]) => {
		setSelectedIds(ids)
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
	}, [])

	const toggleProperty = useCallback(
		(id: string) => {
			const next = selectedIds.includes(id)
				? selectedIds.filter((i) => i !== id)
				: [...selectedIds, id]
			saveSelection(next)
		},
		[selectedIds, saveSelection]
	)

	const selected = useMemo(() => properties.filter((p) => selectedIds.includes(p.id)), [properties, selectedIds])

	useEffect(() => {
		if (selected.length < 2) { setCommonLines([]); return }
		const coords = selected.map(p => p.lat + "," + p.lng).join("|")
		fetch("/api/star/common-lines?props=" + encodeURIComponent(coords))
			.then(r => r.json())
			.then(data => setCommonLines(data.commonLines || []))
			.catch(() => {})
	}, [selected])

	const filteredAll = properties.filter((p) => {
		if (!searchQuery) return true
		const q = searchQuery.toLowerCase()
		return p.title.toLowerCase().includes(q) || (p.address || "").toLowerCase().includes(q)
	})

	return (
		<div className="flex flex-col" style={{ height: "calc(100vh - 48px - 64px)" }}>
			<TodayMap selected={selected} />

			<div className="flex items-center justify-between px-4 py-3 border-b">
				<h2 className="font-semibold text-sm">
					{selected.length} logement{selected.length > 1 ? "s" : ""} aujourd'hui
				</h2>
				<Sheet>
					<SheetTrigger asChild>
						<Button size="sm" className="gap-1 rounded-full">
							<Plus className="h-4 w-4" />
							Ajouter
						</Button>
					</SheetTrigger>
					<SheetContent side="bottom" className="h-[80vh]">
						<SheetHeader className="mb-4">
							<SheetTitle>Sélectionner les logements du jour</SheetTitle>
						</SheetHeader>
						<div className="relative mb-4">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
						</div>
						<div className="overflow-y-auto space-y-1" style={{ maxHeight: "calc(80vh - 140px)" }}>
							{filteredAll.map((p) => {
								const isSelected = selectedIds.includes(p.id)
								return (
									<button key={p.id} type="button" onClick={() => toggleProperty(p.id)}
										className={"w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors " + (isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted")}>
										<div className="min-w-0">
											<div className="text-sm font-medium truncate">{p.title}</div>
											<div className="text-xs text-muted-foreground truncate">{p.address || "Pas d'adresse"}</div>
										</div>
										<div className={"ml-3 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center " + (isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
											{isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
										</div>
									</button>
								)
							})}
						</div>
					</SheetContent>
				</Sheet>
			</div>

			{commonLines.length > 0 && (
				<div className="px-4 py-3 border-b bg-blue-50/50">
					<div className="flex items-center gap-2 mb-2">
						<Bus className="h-4 w-4 text-blue-600" />
						<span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Lignes en commun</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{commonLines.map((l) => (
							<div key={l.line} className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-sm border">
								<span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: l.color }}>{l.line}</span>
								<span className="text-xs text-gray-600">→ {l.terminus}</span>
								<span className="text-[10px] text-gray-400">{l.servedBy} logements</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="flex-1 overflow-y-auto">
				{selected.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center px-4">
						<MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
						<p className="text-muted-foreground text-sm">
							Appuie sur "Ajouter" pour sélectionner les logements du jour
						</p>
					</div>
				) : (
					<div className="divide-y">
						{selected.map((p) => {
							const appleMapsUrl = "https://maps.apple.com/?daddr=" + encodeURIComponent(p.address || p.title)
							return (
								<div key={p.id} className="px-4 py-3">
									<div className="flex items-start justify-between">
										<div className="min-w-0 flex-1">
											<Link href={"/listing/" + p.id} className="hover:underline">
												<h3 className="font-semibold text-sm truncate">{p.title}</h3>
											</Link>
											<p className="text-xs text-muted-foreground mt-0.5 truncate">{p.address}</p>
										</div>
										<button type="button" onClick={() => toggleProperty(p.id)} className="ml-2 p-1 text-muted-foreground hover:text-destructive">
											<X className="h-4 w-4" />
										</button>
									</div>
									<div className="mt-2 flex items-center gap-3">
										<div className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-2 flex-1">
											<Key className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-mono font-bold text-lg tracking-widest">{p.keyboxCode || "—"}</span>
										</div>
										<a href={appleMapsUrl} target="_blank" rel="noopener noreferrer">
											<Button size="sm" variant="outline" className="gap-1 shrink-0">
												<Navigation className="h-3.5 w-3.5" />
												Y aller
											</Button>
										</a>
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
