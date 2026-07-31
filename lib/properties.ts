"use server"

import type { Listing } from "@/data/types"
import { type NewProperty, properties } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { desc, eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import "server-only"
import { z } from "zod"
import { db } from "./db"

const urlSchema = z.string().url().includes("airbnb.com/rooms/").regex(/airbnb\.com\/rooms\/\d+/, "Must be a valid Airbnb listing URL")

export async function createProperty(url: string) {
	const validatedUrl = urlSchema.parse(url)
	const { userId } = await auth()
	if (!userId) throw new Error("Unauthorized")
	await db.insert(properties).values({
		id: nanoid(),
		clerkId: userId,
		url: validatedUrl,
		listingData: null
	})
	return { success: true }
}

export type VisualProperty = {
	id: string; url: string; pricePerNight: number; cleaningPrice?: number
} & ({ status: "pending" } | { status: "loaded"; title: string; location: string; views: number; inquiries: number })

export async function getProperties(): Promise<VisualProperty[]> {
	const { userId } = await auth()
	if (!userId) throw new Error("Unauthorized")
	const results = await db.select({
		id: properties.id, url: properties.url,
		title: sql<string | null>`(${properties.listingData}::json->'data'->>'h1Title')`,
		location: sql<string | null>`(${properties.listingData}::json->'data'->'overview'->>'location')`,
		views: properties.views, inquiries: properties.inquiries,
		hasListingData: sql<boolean>`${properties.listingData} IS NOT NULL`,
		pricePerNight: properties.pricePerNight
	}).from(properties).where(eq(properties.clerkId, userId)).orderBy(desc(properties.createdAt))
	return results.map(r => !r.hasListingData
		? { id: r.id, url: r.url, pricePerNight: r.pricePerNight, status: "pending" as const }
		: { status: "loaded" as const, id: r.id, url: r.url, title: r.title ?? "", location: r.location ?? "", views: r.views, inquiries: r.inquiries, pricePerNight: r.pricePerNight })
}

export async function deleteProperty(propertyId: string) {
	const { userId } = await auth()
	if (!userId) throw new Error("Unauthorized")
	await db.delete(properties).where(sql`${properties.id} = ${propertyId} AND ${properties.clerkId} = ${userId}`)
	return { success: true }
}

export type ExploreProperty = { id: string; title: string; location: string; address: string | null; propertyType: string; capacity: number; rating: number | null; pricePerNight: number; amenityCount: number; mainImage: string }

export async function getExploreProperties(): Promise<ExploreProperty[]> {
	const results = await db.select({
		id: properties.id,
		title: sql<string>`(${properties.listingData}::json->'data'->>'h1Title')`,
		location: sql<string>`(${properties.listingData}::json->'data'->'overview'->>'location')`,
		address: sql<string>`(${properties.listingData}::json->'data'->'location'->>'address')`,
		propertyType: sql<string>`(${properties.listingData}::json->'data'->'overview'->>'propertyType')`,
		capacity: sql<number>`(${properties.listingData}::json->'data'->'overview'->>'capacity')`,
		rating: sql<number>`(${properties.listingData}::json->'data'->'overview'->>'rating')`,
		amenityCount: sql<number>`(${properties.listingData}::json->'data'->'amenities'->>'count')`,
		mainImage: sql<string>`(${properties.listingData}::json->'data'->'overview'->>'imageUrl')`,
		pricePerNight: properties.pricePerNight
	}).from(properties).where(sql`${properties.listingData} IS NOT NULL`).orderBy(sql`${properties.keyboxCode} IS NULL`, sql`(${properties.listingData}::json->'data'->>'h1Title')`)
	return results.map(r => ({ id: r.id, title: r.title ?? "Sans titre", location: r.location ?? "Adresse inconnue", address: r.address, propertyType: r.propertyType ?? "Logement", capacity: r.capacity ?? 1, rating: r.rating, amenityCount: r.amenityCount ?? 0, mainImage: r.mainImage, pricePerNight: r.pricePerNight }))
}

export async function incrementPropertyViews(propertyId: string) {
	await db.update(properties).set({ views: sql`${properties.views} + 1` }).where(eq(properties.id, propertyId))
}

export async function incrementPropertyInquiries(propertyId: string) {
	await db.update(properties).set({ inquiries: sql`${properties.inquiries} + 1` }).where(eq(properties.id, propertyId))
}

export async function updatePropertyPrice(propertyId: string, price: number) {
	const { userId } = await auth()
	if (!userId) throw new Error("Unauthorized")
	await db.update(properties).set({ pricePerNight: price }).where(sql`${properties.id} = ${propertyId} AND ${properties.clerkId} = ${userId}`)
	return { success: true }
}

// getListing — retourne un logement par ID
export type ListingWithPrice = {
	data: Listing["data"]
	pricePerNight: number
	keyboxCode: string | null
	driveUrl: string | null
	comment: string | null
}

export async function getListing(id: string): Promise<ListingWithPrice | null> {
	const property = await db
		.select({
			listingData: properties.listingData,
			pricePerNight: properties.pricePerNight,
			keyboxCode: properties.keyboxCode,
			driveUrl: properties.driveUrl,
			comment: properties.comment
		})
		.from(properties)
		.where(eq(properties.id, id))
		.limit(1)
		.then((rows) => rows[0])

	if (!property || !property.listingData) return null

	const listing = property.listingData as Listing
	for (const room of listing.data.gallery.rooms) {
		for (const image of room.images) {
			image.orientation = image.orientation.toUpperCase() as "LANDSCAPE" | "PORTRAIT"
		}
	}

	return {
		data: listing.data,
		pricePerNight: property.pricePerNight,
		keyboxCode: property.keyboxCode,
		driveUrl: property.driveUrl,
		comment: property.comment
	}
}

export type TodayProperty = { id: string; title: string; address: string | null; lat: number; lng: number; keyboxCode: string | null; pricePerNight: number }

export async function getPropertiesForToday(): Promise<TodayProperty[]> {
	const results = await db.select({
		id: properties.id,
		title: sql<string>`(${properties.listingData}::json->'data'->>'h1Title')`,
		address: sql<string>`(${properties.listingData}::json->'data'->'location'->>'address')`,
		locationTitle: sql<string>`(${properties.listingData}::json->'data'->'location'->>'title')`,
		lat: sql<number>`(${properties.listingData}::json->'data'->'location'->'coordinates'->>'lat')::float`,
		lng: sql<number>`(${properties.listingData}::json->'data'->'location'->'coordinates'->>'lng')::float`,
		keyboxCode: properties.keyboxCode,
		pricePerNight: properties.pricePerNight
	}).from(properties).where(sql`${properties.listingData} IS NOT NULL`).orderBy(sql`(${properties.listingData}::json->'data'->>'h1Title')`)
	return results.map(r => ({ id: r.id, title: r.title ?? "Sans titre", address: r.address || r.locationTitle || null, lat: r.lat ?? 48.1173, lng: r.lng ?? -1.6778, keyboxCode: r.keyboxCode, pricePerNight: r.pricePerNight }))
}

export async function updateKeyboxCode(propertyId: string, code: string) {
	await db.update(properties).set({ keyboxCode: code }).where(eq(properties.id, propertyId))
	return { success: true }
}
