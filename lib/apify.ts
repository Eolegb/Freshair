import "server-only"

import type { Listing } from "@/data/types"
import { properties, scrapingJobs } from "@/db/schema"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ApifyClient } from "apify-client"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

const ACTOR_ID = "PD6Eb2AlmsXqGxffs"

function getApifyConfig() {
	if (!process.env.APIFY_API_TOKEN) {
		throw new Error("APIFY_API_TOKEN is not set")
	}
	if (!process.env.VERCEL_URL) {
		throw new Error("VERCEL_URL is not set")
	}
	if (!process.env.WEBHOOK_SECRET) {
		throw new Error("WEBHOOK_SECRET is not set")
	}
	const WEBHOOK_URL = `https://${process.env.VERCEL_URL}/api/apify-webhook?secret=${process.env.WEBHOOK_SECRET}`
	const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })
	return { WEBHOOK_URL, client }
}

export const ApifyWebhookPayloadSchema = z.object({
	userId: z.string(),
	createdAt: z.string().datetime(),
	eventType: z.enum(["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED"]),
	eventData: z.object({
		actorId: z.string(),
		actorRunId: z.string()
	}),
	resource: z
		.object({
			id: z.string()
		})
		.passthrough()
})

export type ApifyWebhookPayload = z.infer<typeof ApifyWebhookPayloadSchema>

export async function queueScraping(url: string, propertyId: string) {
	const { WEBHOOK_URL, client } = getApifyConfig()
	const listingActor = await client.actor(ACTOR_ID)
	logger.info("Starting scraping job", { url, propertyId })
	const id = nanoid()

	const input = {
		startUrls: [{ url }]
	}

	try {
		const run = await listingActor.start(input, {
			webhooks: [
				{
					eventTypes: ["ACTOR.RUN.SUCCEEDED"],
					requestUrl: WEBHOOK_URL,
					idempotencyKey: id
				}
			]
		})

		logger.info("Apify actor started successfully", {
			runId: run.id,
			propertyId,
			url
		})

		await db.insert(scrapingJobs).values({
			id,
			propertyId,
			runId: run.id,
			status: "pending",
			url,
			startedAt: new Date()
		})

		logger.info("Scraping job recorded in database", {
			runId: run.id,
			propertyId
		})
	} catch (error) {
		logger.error("Failed to queue scraping job", {
			error,
			url,
			propertyId
		})
		throw error
	}
}

export async function fetchAndStoreResults(runId: string) {
	const { client } = getApifyConfig()
	const listingActor = await client.actor(ACTOR_ID)
	logger.info("Fetching scraping results", { runId })

	try {
		const job = await db
			.select()
			.from(scrapingJobs)
			.where(eq(scrapingJobs.runId, runId))
			.limit(1)
			.then((jobs) => jobs[0])
		if (!job) {
			throw new Error("Job not found")
		}

		const runs = await listingActor.runs()
		const list = await runs.list()
		const run = list.items.find((r) => r.id === runId)
		const datasetId = run?.defaultDatasetId
		if (!datasetId) {
			throw new Error("Dataset ID not found")
		}

		const { items } = await client.dataset(datasetId).listItems()
		logger.info("Retrieved dataset from Apify", {
			itemCount: items.length,
			datasetId
		})

		const listingData = items[0]

		await db
			.update(properties)
			.set({ listingData: listingData as unknown as Listing })
			.where(eq(properties.id, job.propertyId))

		logger.info("Updated property with scraped data", {
			propertyId: job.propertyId,
			runId
		})
	} catch (error) {
		logger.error("Failed to fetch and store results", {
			error,
			runId
		})
		throw error
	}
}
