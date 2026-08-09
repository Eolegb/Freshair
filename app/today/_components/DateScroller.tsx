"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface DateScrollerProps {
	onDateChange?: (date: Date) => void
}

export function DateScroller({ onDateChange }: DateScrollerProps) {
	const [selectedDate, setSelectedDate] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("freshair_selected_date")
			if (stored) return new Date(stored)
		}
		return new Date()
	})

	const scrollContainerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		localStorage.setItem("freshair_selected_date", selectedDate.toISOString())
		onDateChange?.(selectedDate)
	}, [selectedDate, onDateChange])

	// Générer les dates (30 jours avant et après aujourd'hui)
	const getDateRange = () => {
		const today = new Date()
		const dates = []
		for (let i = -30; i <= 30; i++) {
			const date = new Date(today)
			date.setDate(date.getDate() + i)
			dates.push(date)
		}
		return dates
	}

	const dateRange = getDateRange()

	const handleDateClick = useCallback((date: Date) => {
		setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()))
	}, [])

	const handlePrev = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({ left: -100, behavior: "smooth" })
		}
	}

	const handleNext = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({ left: 100, behavior: "smooth" })
		}
	}

	const isToday = (date: Date) => {
		const today = new Date()
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		)
	}

	const isSelected = (date: Date) => {
		return (
			date.getDate() === selectedDate.getDate() &&
			date.getMonth() === selectedDate.getMonth() &&
			date.getFullYear() === selectedDate.getFullYear()
		)
	}

	const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

	return (
		<div className="sticky top-12 z-40 bg-background/95 backdrop-blur border-b">
			<div className="flex items-center gap-2 px-2 py-3">
				{/* Bouton précédent */}
				<button
					onClick={handlePrev}
					className="p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0"
					type="button"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>

				{/* Scroll horizontal des dates */}
				<div
					ref={scrollContainerRef}
					className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
					style={{ scrollBehavior: "smooth" }}
				>
					{dateRange.map((date) => {
						const day = dayLabels[date.getDay()]
						const dayNum = date.getDate()

						return (
							<button
								key={date.toISOString()}
								onClick={() => handleDateClick(date)}
								type="button"
								className={`
									flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all shrink-0 whitespace-nowrap
									${
										isSelected(date)
											? "bg-primary text-primary-foreground"
											: isToday(date)
												? "bg-primary/10 text-primary border border-primary/20"
												: "hover:bg-muted"
									}
								`}
							>
								<span className="text-xs font-semibold">{day}</span>
								<span className="text-lg font-bold">{dayNum}</span>
							</button>
						)
					})}
				</div>

				{/* Bouton suivant */}
				<button
					onClick={handleNext}
					className="p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0"
					type="button"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}
