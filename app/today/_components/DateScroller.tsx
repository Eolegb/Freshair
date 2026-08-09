"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface DateScrollerProps {
	onDateChange?: (date: Date) => void
}

export function DateScroller({ onDateChange }: DateScrollerProps) {
	const [currentMonth, setCurrentMonth] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("freshair_current_month")
			if (stored) return new Date(stored)
		}
		return new Date()
	})

	const [selectedDate, setSelectedDate] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("freshair_selected_date")
			if (stored) return new Date(stored)
		}
		return new Date()
	})

	const scrollContainerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		localStorage.setItem("freshair_current_month", currentMonth.toISOString())
	}, [currentMonth])

	useEffect(() => {
		localStorage.setItem("freshair_selected_date", selectedDate.toISOString())
		onDateChange?.(selectedDate)
	}, [selectedDate, onDateChange])

	// Générer les dates du mois courant
	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
	}

	const getFirstDayOfMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
	}

	const getDates = () => {
		const daysInMonth = getDaysInMonth(currentMonth)
		const firstDay = getFirstDayOfMonth(currentMonth)
		const dates = []

		// Jours du mois précédent
		const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
		const daysInPrevMonth = getDaysInMonth(prevMonth)
		for (let i = firstDay - 1; i >= 0; i--) {
			const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i)
			dates.push({ date, isCurrentMonth: false })
		}

		// Jours du mois courant
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
			dates.push({ date, isCurrentMonth: true })
		}

		// Jours du mois suivant
		const remainingDays = 42 - dates.length
		for (let day = 1; day <= remainingDays; day++) {
			const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day)
			dates.push({ date, isCurrentMonth: false })
		}

		return dates
	}

	const handlePrevMonth = () => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
	}

	const handleNextMonth = () => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
	}

	const handleDateClick = useCallback((date: Date) => {
		setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()))
	}, [])

	const dates = getDates()

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

	const monthName = currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
	const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

	return (
		<div className="sticky top-12 z-40 bg-background/95 backdrop-blur border-b">
			{/* Titre du mois avec navigation */}
			<div className="flex items-center justify-between px-4 py-2 border-b">
				<button
					onClick={handlePrevMonth}
					className="p-1.5 hover:bg-muted rounded-lg transition-colors"
					type="button"
					aria-label="Mois précédent"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<h3 className="font-semibold text-sm capitalize min-w-32 text-center">
					{monthName}
				</h3>
				<button
					onClick={handleNextMonth}
					className="p-1.5 hover:bg-muted rounded-lg transition-colors"
					type="button"
					aria-label="Mois suivant"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>

			{/* Grille calendaire */}
			<div className="px-2 py-3">
				{/* En-têtes jours */}
				<div className="grid grid-cols-7 gap-1 mb-2">
					{dayLabels.map((day) => (
						<div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
							{day}
						</div>
					))}
				</div>

				{/* Grille des dates */}
				<div className="grid grid-cols-7 gap-1">
					{dates.map((item, idx) => {
						const { date, isCurrentMonth } = item
						return (
							<button
								key={idx}
								onClick={() => handleDateClick(date)}
								type="button"
								className={`
									aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center
									${!isCurrentMonth ? "opacity-30 text-muted-foreground" : ""}
									${
										isSelected(date)
											? "bg-primary text-primary-foreground font-bold"
											: isToday(date)
												? "bg-primary/10 text-primary border border-primary/20 font-bold"
												: "hover:bg-muted"
									}
								`}
							>
								{date.getDate()}
							</button>
						)
					})}
				</div>
			</div>
		</div>
	)
}
