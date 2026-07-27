"use client"
import MobileDatePickerWithRange from "@/components/mobile-date-picker-with-range"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/components/ui/select"
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { createBooking } from "@/lib/bookings"
import { incrementPropertyInquiries } from "@/lib/properties"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"
import type { DateRange } from "react-day-picker"

interface MobileBookingBarProps {
	propertyId: string
	pricePerNight: number
	capacity: number
	className?: string
}

export function MobileBookingBar({
	propertyId,
	pricePerNight,
	className,
	capacity
}: MobileBookingBarProps) {
	const [email, setEmail] = useState("")
	const [guests, setGuests] = useState("1")
	const [dates, setDates] = useState<DateRange | undefined>()
	const { toast } = useToast()
	const [isLoading, setIsLoading] = useState(false)
	const sheetCloseRef = useRef<HTMLButtonElement>(null)

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

			sheetCloseRef.current?.click()
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
		<div
			className={cn(
				"fixed bottom-0 left-0 right-0 border-t bg-background p-4 flex items-center justify-between",
				className
			)}
		>
			<div className="flex items-baseline gap-1">
				<span className="text-2xl font-semibold">{pricePerNight}€</span>
				<span className="text-base text-muted-foreground">par nuit</span>
			</div>

			<Sheet>
				<SheetTrigger asChild>
					<Button size="lg">Reserve</Button>
				</SheetTrigger>
				<SheetContent side="bottom" className="p-4">
					<SheetClose ref={sheetCloseRef} className="hidden" />
					<SheetHeader className="mb-6">
						<SheetTitle className="text-xl font-semibold">
							Reserve your stay
						</SheetTitle>
					</SheetHeader>
					<div className="space-y-6">
						<div className="flex items-baseline gap-1">
							<span className="text-2xl font-bold">{pricePerNight}€</span>
							<span className="text-gray-500">nuit</span>
						</div>
						<MobileDatePickerWithRange date={dates} onDateSelect={setDates} />
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
						<Button
							className="w-full"
							size="lg"
							onClick={handleBook}
							disabled={!email || !dates || isLoading}
						>
							{isLoading ? "Sending..." : "Reserve"}
						</Button>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	)
}
