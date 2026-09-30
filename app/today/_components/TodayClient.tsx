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
import { useToast } from "@/hooks/use-toast"
import type { TodayProperty } from "@/lib/properties"
import { AlertCircle, Bus, Check, Key, Loader2, MapPin, Navigation, Plus, Search, X } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DateScroller } from "./DateScroller"

const TodayMap = dynamic(() => import("./TodayMap").then(m => ({ default: m.TodayMap })), {
	ssr: false,
	loading: () => <div className="w-full flex-shrink-0 bg-muted animate-pulse" style={{ height: "40%" }} />
})

const STORAGE_KEY = "freshair_today"
const API_TOKEN = "nomad-api-secret-2026"

type CommonLine = { line: string; color: string; servedBy: number; terminus: string }
type Statut = "idle" | "saving" | "saved" | "error"

// Le jour choisi, en date LOCALE. `toISOString()` renvoie la date UTC : passe
// minuit a Paris on est encore la veille en UTC, et les prestations etaient
// enregistrees sur le mauvais jour. fr-CA produit directement AAAA-MM-JJ.
function jourLocal(d: Date): string {
	return new Intl.DateTimeFormat("fr-CA", {
		timeZone: "Europe/Paris",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(d)
}

export function TodayClient({ properties }: { properties: TodayProperty[] }) {
	const { toast } = useToast()
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [searchQuery, setSearchQuery] = useState("")
	const [commonLines, setCommonLines] = useState<CommonLine[]>([])
	const [statut, setStatut] = useState<Statut>("idle")
	const [loading, setLoading] = useState(true)
	const [currentDate, setCurrentDate] = useState<Date>(new Date())
	const initialized = useRef(false)

	const dateStr = jourLocal(currentDate)
	const dateStorageKey = `${STORAGE_KEY}_${dateStr}`

	// Enregistre la selection du jour choisi. Ne JAMAIS avaler l'erreur : c'etait
	// la cause du bug principal — la selection s'affichait a l'ecran sans jamais
	// atteindre la base, et rien ne le signalait.
	const saveToApi = useCallback(
		async (ids: string[], date: string) => {
			setStatut("saving")
			try {
				const res = await fetch("/api/nomad/today", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token: API_TOKEN, date, property_ids: ids })
				})
				if (!res.ok) {
					const detail = await res.text().catch(() => "")
					throw new Error(`HTTP ${res.status}${detail ? " — " + detail.slice(0, 120) : ""}`)
				}
				const data = await res.json()
				// On affiche ce que la BASE contient, pas ce qu'on a demande d'ecrire.
				const reels: string[] = data.property_ids || []
				setSelectedIds(reels)
				localStorage.setItem(dateStorageKey, JSON.stringify(reels))
				setStatut("saved")
				if (data.ignores?.length) {
					toast({
						title: "Selection ajustee",
						description: `${data.ignores.length} logement(s) n'existent plus et ont ete retires.`
					})
				}
			} catch (e: any) {
				setStatut("error")
				toast({
					variant: "destructive",
					title: "Enregistrement impossible",
					description:
						"Les prestations ne sont PAS enregistrees. " + (e?.message || "Verifie ta connexion et reessaie.")
				})
			}
		},
		[dateStorageKey, toast]
	)

	useEffect(() => {
		const key = `${STORAGE_KEY}_${dateStr}`
		let local: string[] = []
		try {
			const stored = localStorage.getItem(key)
			if (stored) local = JSON.parse(stored)
		} catch {}

		setLoading(true)
		fetch(`/api/nomad/today?date=${dateStr}&token=${API_TOKEN}`)
			.then(r => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`)
				return r.json()
			})
			.then(data => {
				// La base fait foi, y compris quand elle dit « vide » : l'ancien code
				// ne remplacait la selection que si la reponse etait non vide, si bien
				// qu'une journee videe ailleurs restait affichee comme pleine.
				const ids = (data.prestations || []).map((p: any) => p.id)
				setSelectedIds(ids)
				setStatut("saved")
				localStorage.setItem(key, JSON.stringify(ids))
			})
			.catch(() => {
				setSelectedIds(local)
				setStatut("error")
				toast({
					variant: "destructive",
					title: "Base injoignable",
					description: "Derniere selection connue affichee. Les modifications ne seront pas enregistrees."
				})
			})
			.finally(() => {
				setLoading(false)
				initialized.current = true
			})
	}, [dateStr, toast])

	const saveSelection = useCallback(
		(ids: string[]) => {
			setSelectedIds(ids)
			localStorage.setItem(dateStorageKey, JSON.stringify(ids))
			if (initialized.current) {
				saveToApi(ids, dateStr)
			}
		},
		[dateStr, dateStorageKey, saveToApi]
	)

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
		// overflow-hidden et hauteur bornee : la page ne defile plus elle-meme, une
		// seule zone defile — la liste. Avant, le document defilait ET la liste
		// defilait, et le bandeau venait recouvrir les prestations.
		<div className="flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 48px - 64px)" }}>
			<DateScroller onDateChange={setCurrentDate} />
			<TodayMap selected={selected} />

			{/* shrink-0 : ces barres ne doivent jamais etre comprimees par le flex,
			    sinon c'est la liste qui perd la place. */}
			<div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
				<div className="min-w-0">
					<h2 className="font-semibold text-sm">
						{selected.length} logement{selected.length > 1 ? "s" : ""} - Planning
					</h2>
					<StatutLigne statut={statut} onRetry={() => saveToApi(selectedIds, dateStr)} />
				</div>
				<Sheet>
					<SheetTrigger asChild>
						<Button size="sm" className="gap-1 rounded-full shrink-0">
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
				// shrink-0 et hauteur bornee : ce bloc ne doit jamais pousser la liste
				// hors de l'ecran. Long, il defile lui-meme.
				<div className="px-4 py-3 border-b bg-blue-50/50 shrink-0 max-h-[24dvh] overflow-y-auto">
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

			{/* min-h-0 est indispensable : sans lui un enfant flex scrollable refuse de
			    retrecir et deborde au lieu de defiler. Cause directe des prestations
			    invisibles sous le bandeau. */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				{selected.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center px-4">
						<MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
						<p className="text-muted-foreground text-sm">
							{loading ? "Chargement..." : "Appuie sur \"Ajouter\" pour sélectionner les logements de ce jour"}
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

// Rend l'etat d'enregistrement VISIBLE. Sans ca une selection non enregistree est
// indiscernable d'une selection enregistree — exactement le probleme signale.
function StatutLigne({ statut, onRetry }: { statut: Statut; onRetry: () => void }) {
	if (statut === "saving") {
		return (
			<span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
				<Loader2 className="h-3 w-3 animate-spin" /> Enregistrement...
			</span>
		)
	}
	if (statut === "error") {
		return (
			<button type="button" onClick={onRetry} className="flex items-center gap-1 text-xs text-destructive mt-0.5 hover:underline">
				<AlertCircle className="h-3 w-3" /> Non enregistre — appuie pour reessayer
			</button>
		)
	}
	if (statut === "saved") {
		return (
			<span className="flex items-center gap-1 text-xs text-emerald-600 mt-0.5">
				<Check className="h-3 w-3" /> Enregistre
			</span>
		)
	}
	return <span className="text-xs text-muted-foreground mt-0.5">Chargement...</span>
}