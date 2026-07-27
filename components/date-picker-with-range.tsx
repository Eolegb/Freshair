"use client"

import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type * as React from "react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerWithRangeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	date?: DateRange | undefined
	onDateSelect?: (date: DateRange | undefined) => void
}

export default function DatePickerWithRange({
	className,
	date,
	onDateSelect
}: DatePickerWithRangeProps) {
	return (
		<div className={cn("grid gap-2 w-full", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={"outline"}
						className={cn(
							"w-full justify-start text-left font-normal",
							!date && "text-muted-foreground"
						)}
					>
						<CalendarIcon />
						{date?.from ? (
							date.to ? (
								<>
									{format(date.from, "LLL dd, y")} -{" "}
									{format(date.to, "LLL dd, y")}
								</>
							) : (
								format(date.from, "LLL dd, y")
							)
						) : (
							<span>Pick a date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={date?.from}
						selected={date}
						onSelect={onDateSelect}
						numberOfMonths={2}
						disabled={{ before: addDays(new Date(), 0) }}
					/>
				</PopoverContent>
			</Popover>
		</div>
	)
}
