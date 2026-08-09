"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface DateScrollerProps {
	onDateChange?: (date: Date) => void
	onMonthChange?: (month: Date) => void
}

export function DateScroller({ onDateChange, onMonthChange }: DateScrollerProps) {
	const [currentMonth, setCurrentMonth] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("freshair_month")
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

	useEffect(() => {
		localStorage.setItem("freshair_month", currentMonth.toISOString())
		onMonthChange?.(currentMonth)
	}, [currentMonth, onMonthChange])

	useEffect(() => {
		localStorage.setItem("freshair_selected_date", selectedDate.toISOString())
		onDateChange?.(selectedDate)
	}, [selectedDate, onDateChange])

	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
	}

	const getFirstDayOfMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
	}

	const handlePrevMonth = useCallback(() => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
	}, [currentMonth])

	const handleNextMonth = useCallback(() => {
		setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
	}, [currentMonth])

	const handleDateClick = useCallback((day: number) => {
		setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
	}, [currentMonth])

	const daysInMonth = getDaysInMonth(currentMonth)
	const firstDay = getFirstDayOfMonth(currentMonth)
	const days = []

	for (let i = 0; i < firstDay; i++) {
		days.push(null)
	}

	for (let day = 1; day <= daysInMonth; day++) {
		days.push(day)
	}

	const monthName = currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
	const isToday = (day: number | null) => {
		if (!day) return false
		const today = new Date()
		return (
			day === today.getDate() &&
			currentMonth.getMonth() === today.getMonth() &&
			currentMonth.getFullYear() === today.getFullYear()
		)
	}

	const isSelected = (day: number | null) => {
		if (!day) return false
		return (
			day === selectedDate.getDate() &&
			currentMonth.getMonth() === selectedDate.getMonth() &&
			currentMonth.getFullYear() === selectedDate.getFullYear()
		)
	}

	return (
		<div className="sticky top-12 z-40 bg-background/95 backdrop-blur border-b">
			<div className="px-4 py-3">
				{/* Month Navigation */}
				<div className="flex items-center justify-between mb-3">
					<button
						onClick={handlePrevMonth}
						className="p-1 hover:bg-muted rounded-lg transition-colors"
						type="button"
					>
						<ChevronLeft className="h-5 w-5" />
					</button>
					<h3 className="font-semibold text-sm capitalize">
						{monthName}
					</h3>
					<button
						onClick={handleNextMonth}
						className="p-1 hover:bg-muted rounded-lg transition-colors"
						type="button"
					>
						<ChevronRight className="h-5 w-5" />
					</button>
				</div>

				{/* Calendar Grid */}
				<div className="grid grid-cols-7 gap-1">
					{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
						<div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
							{day}
						</div>
					))}
					{days.map((day, idx) => (
						<button
							key={idx}
							onClick={() => day && handleDateClick(day)}
							disabled={!day}
							type="button"
							className={`
								aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center
								${!day ? "opacity-0" : ""}
								${isSelected(day) ? "bg-primary text-primary-foreground" : isToday(day) ? "bg-primary/10 text-primary" : "hover:bg-muted"}
							`}
						>
							{day}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}
