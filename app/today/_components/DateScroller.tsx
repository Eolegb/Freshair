"use client"

import {
	addMonths,
	eachDayOfInterval,
	endOfMonth,
	format,
	isSameDay,
	isToday,
	startOfDay,
	startOfMonth
} from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface DateScrollerProps {
	onDateChange?: (date: Date) => void
}

export function DateScroller({ onDateChange }: DateScrollerProps) {
	const [selectedDate, setSelectedDate] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("freshair_selected_date")
			if (stored) return startOfDay(new Date(stored))
		}
		return startOfDay(new Date())
	})

	// L'ancre est toujours le 1er du mois affiche — garder le quantieme du jour
	// selectionne ferait deborder `addMonths` sur les mois qui n'ont pas ce jour (29-31).
	const [anchorMonth, setAnchorMonth] = useState(() =>
		startOfMonth(selectedDate)
	)

	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

	useEffect(() => {
		localStorage.setItem("freshair_selected_date", selectedDate.toISOString())
		onDateChange?.(selectedDate)
	}, [selectedDate, onDateChange])

	const dates = useMemo(
		() =>
			eachDayOfInterval({ start: anchorMonth, end: endOfMonth(anchorMonth) }),
		[anchorMonth]
	)

	// Ramene le jour selectionne dans la vue quand il est visible dans le bandeau.
	// `dates` est volontairement dans les dependances : au changement de mois on
	// veut redefiler une fois les boutons du nouveau mois montes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: dates est intentionnel, voir ci-dessus
	useEffect(() => {
		const key = format(selectedDate, "yyyy-MM-dd")
		const el = dayRefs.current.get(key)
		el?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
			block: "nearest"
		})
	}, [selectedDate, dates])

	const handlePrevMonth = () => {
		setAnchorMonth((prev) => addMonths(prev, -1))
	}

	const handleNextMonth = () => {
		setAnchorMonth((prev) => addMonths(prev, 1))
	}

	const handleDateClick = useCallback((date: Date) => {
		const day = startOfDay(date)
		setSelectedDate(day)
		// Resynchronise le titre du mois si le jour touche appartient a un autre mois
		// que l'ancre courante.
		setAnchorMonth((prev) =>
			prev.getMonth() === day.getMonth() &&
			prev.getFullYear() === day.getFullYear()
				? prev
				: startOfMonth(day)
		)
	}, [])

	const monthLabel = format(anchorMonth, "LLLL yyyy", { locale: fr })
	const dayLabels: Record<number, string> = {
		0: "di",
		1: "lu",
		2: "ma",
		3: "me",
		4: "je",
		5: "ve",
		6: "sa"
	}

	return (
		// shrink-0 et non sticky : la page ne defile plus (le parent borne la hauteur),
		// donc sticky n'aurait aucun effet et laisserait la barre se faire comprimer.
		<div className="shrink-0 z-40 bg-background/95 backdrop-blur border-b">
			{/* Titre du mois avec navigation */}
			<div className="flex items-center justify-between px-4 py-2">
				<button
					onClick={handlePrevMonth}
					className="p-1.5 hover:bg-muted rounded-lg transition-colors text-primary"
					type="button"
					aria-label="Mois précédent"
				>
					<ChevronLeft className="h-5 w-5" />
				</button>
				<h3 className="text-xs text-muted-foreground capitalize">
					{monthLabel}
				</h3>
				<button
					onClick={handleNextMonth}
					className="p-1.5 hover:bg-muted rounded-lg transition-colors text-primary"
					type="button"
					aria-label="Mois suivant"
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>

			{/* Bandeau de dates défilable horizontalement */}
			<div
				ref={scrollContainerRef}
				className="flex gap-1 overflow-x-auto px-3 pb-3 pt-1 scrollbar-hide snap-x snap-mandatory"
			>
				{dates.map((date) => {
					const key = format(date, "yyyy-MM-dd")
					const selected = isSameDay(date, selectedDate)
					const today = isToday(date)
					return (
						<button
							key={key}
							ref={(el) => {
								if (el) dayRefs.current.set(key, el)
								else dayRefs.current.delete(key)
							}}
							onClick={() => handleDateClick(date)}
							type="button"
							className="flex flex-col items-center gap-1 shrink-0 w-11 snap-center"
						>
							<span
								className={`text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}
							>
								{dayLabels[date.getDay()]}
							</span>
							<span
								className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
									selected
										? "bg-primary text-primary-foreground"
										: today
											? "text-primary border border-primary/30"
											: "text-foreground hover:bg-muted"
								}`}
							>
								{date.getDate()}
							</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}