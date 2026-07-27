import { properties } from "@/db/schema"
import { db } from "@/lib/db"
import { clerkClient } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import "server-only"

export async function getUserEmailAddresses(clerkId: string) {
	try {
		const client = await clerkClient()
		return (await client.users.getUser(clerkId)).emailAddresses
			.filter((email) => email.verification)
			.map((email) => email.emailAddress)
	} catch (error) {
		console.error("Error fetching user email info:", error)
		throw error
	}
}

export async function getHostEmailAddress(propertyId: string) {
	try {
		const property = await db
			.select()
			.from(properties)
			.where(eq(properties.id, propertyId))
			.limit(1)
			.then((property) => property[0])
		if (!property) {
			throw new Error(`No property found with id: ${propertyId}`)
		}

		const emails = await getUserEmailAddresses(property.clerkId)
		return emails[0] // Return first verified email
	} catch (error) {
		console.error("Error fetching host email:", error)
		throw error
	}
}
