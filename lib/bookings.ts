"use server"

import { getHostEmailAddress } from "@/lib/clerk"
import { FROM_EMAIL, postmark } from "@/lib/postmark"
import type { DateRange } from "react-day-picker"

interface BookingData {
	propertyId: string
	email: string
	guests: number
	dates: DateRange
	pricePerNight: number
}

export async function createBooking(data: BookingData) {
	if (!postmark) {
		throw new Error("Le service d'email n'est pas configuré")
	}

	const hostEmail = await getHostEmailAddress(data.propertyId)

	await postmark.sendEmail({
		From: FROM_EMAIL,
		To: hostEmail,
		Subject: "New Booking Request",
		TextBody: `
            New booking request:
            Guest Email: ${data.email}
            Guests: ${data.guests}
            Dates: ${data.dates.from?.toLocaleDateString()} - ${data.dates.to?.toLocaleDateString()}
            Price per night: $${data.pricePerNight}
        `
	})
}
