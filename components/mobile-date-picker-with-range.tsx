"use client"

import { addDays, format } from "date-fns"
import type * as React from "react"
import type { DateRange } from "react-day-picker"

import { MobileCalendar } from "@/components/ui/mobile-calendar"
import { cn } from "@/lib/utils"

interface MobileDatePickerWithRangeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	date?: DateRange | undefined
	onDateSelect?: (date: DateRange | undefined) => void
}

export default function MobileDatePickerWithRange({
	className,
	date,
	onDateSelect
}: MobileDatePickerWithRangeProps) {
	return (
		<div className={cn("grid gap-2", className)}>
			<div className="text-sm text-muted-foreground">
				{date?.from ? (
					date.to ? (
						<>
							{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
						</>
					) : (
						format(date.from, "LLL dd, y")
					)
				) : (
					<span>Pick a date range</span>
				)}
			</div>
			<MobileCalendar
				mode="range"
				defaultMonth={date?.from}
				selected={date}
				onSelect={onDateSelect}
				numberOfMonths={1}
				disabled={{ before: addDays(new Date(), 0) }}
				className="rounded-md border"
			/>
		</div>
	)
}
