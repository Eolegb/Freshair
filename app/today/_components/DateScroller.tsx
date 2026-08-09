"use client"

import {
	addDays,
	addMonths,
	format,
	isSameDay,
	isToday,
	startOfDay
} from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface DateScrollerProps {
	onDateChange?: (date: Date) => void
}

// How many days to show before/after the anchor date in the strip.
const DAYS_BEFORE = 7
const DAYS_AFTER = 21

export function DateScroller({ onDateChange }: DateScrollerProps) {
	const [selectedDate, setSelectedDate] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("freshair_selected_date")
			if (stored) return startOfDay(new Date(stored))
		}
		return startOfDay(new Date())
	})

	// Anchor controls which window of days is rendered in the strip. It only
	// changes via the month arrows — picking a day in place shouldn't re-center
	// the whole strip under the user's finger.
	const [anchorDate, setAnchorDate] = useState(selectedDate)

	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

	useEffect(() => {
		localStorage.setItem("freshair_selected_date", selectedDate.toISOString())
		onDateChange?.(selectedDate)
	}, [selectedDate, onDateChange])

	const dates = useMemo(() => {
		const days: Date[] = []
		for (let i = -DAYS_BEFORE; i <= DAYS_AFTER; i++) {
			days.push(addDays(anchorDate, i))
		}
		return days
	}, [anchorDate])

	// Scroll the selected day into view whenever the visible window changes
	// (month nav, or the anchor jumping to a freshly-picked out-of-range day).
	// `dates` is intentionally in the dependency array even though only its
	// identity (not selectedDate) changes on month nav — we want to re-scroll
	// then too, once the new day buttons have mounted.
	// biome-ignore lint/correctness/useExhaustiveDependencies: dates is intentional, see comment above
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
		setAnchorDate((prev) => addMonths(prev, -1))
	}

	const handleNextMonth = () => {
		setAnchorDate((prev) => addMonths(prev, 1))
	}

	const handleDateClick = useCallback((date: Date) => {
		setSelectedDate(startOfDay(date))
	}, [])

	const monthLabel = format(selectedDate, "LLLL yyyy", { locale: fr })
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
		<div className="sticky top-12 z-40 bg-background/95 backdrop-blur border-b">
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
				<h3 className="font-semibold text-base capitalize text-primary">
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
