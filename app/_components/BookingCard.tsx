"use client"

import DatePickerWithRange from "@/components/date-picker-with-range"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createBooking } from "@/lib/bookings"
import { incrementPropertyInquiries } from "@/lib/properties"
import { useState } from "react"
import type { DateRange } from "react-day-picker"

interface BookingCardProps {
	propertyId: string
	pricePerNight: number
	capacity: number
}

export function BookingCard({
	propertyId,
	pricePerNight,
	capacity
}: BookingCardProps) {
	const [email, setEmail] = useState("")
	const [guests, setGuests] = useState("1")
	const [dates, setDates] = useState<DateRange | undefined>()
	const { toast } = useToast()
	const [isLoading, setIsLoading] = useState(false)

	const handleBook = async () => {
		if (!dates || !email) return

		setIsLoading(true)
		try {
			await createBooking({
				propertyId,
				email,
				guests: Number.parseInt(guests),
				dates,
				pricePerNight
			})

			await incrementPropertyInquiries(propertyId)

			toast({
				title: "Booking Request Sent!",
				description: "The property owner will contact you soon."
			})
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to send booking request. Please try again.",
				variant: "destructive"
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="col-span-1">
			<Card className="sticky top-24">
				<CardContent className="p-6">
					<div className="flex items-baseline gap-1">
						<span className="text-2xl font-bold">{pricePerNight}€</span>
						<span className="text-gray-500">nuit</span>
					</div>
					<div className="mt-4 space-y-4">
						<DatePickerWithRange date={dates} onDateSelect={setDates} />
						<Select defaultValue="1" onValueChange={setGuests}>
							<SelectTrigger>
								<SelectValue placeholder="Number of guests" />
							</SelectTrigger>
							<SelectContent>
								{[...Array(capacity)].map((_, i) => {
									const guestCount = i + 1
									return (
										<SelectItem key={guestCount} value={guestCount.toString()}>
											{guestCount} {guestCount === 1 ? "guest" : "guests"}
										</SelectItem>
									)
								})}
							</SelectContent>
						</Select>
						<Input
							type="email"
							placeholder="Your email address"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<Button
						className="w-full mt-4"
						onClick={handleBook}
						disabled={!email || !dates || isLoading}
					>
						{isLoading ? "Sending..." : "Reserve"}
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}
