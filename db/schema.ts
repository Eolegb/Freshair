import type { Listing } from "@/data/types"
import {
	date,
	index,
	integer,
	json,
	pgTable,
	primaryKey,
	text,
	timestamp
} from "drizzle-orm/pg-core"

// ATTENTION : ce fichier decrit la base REELLE (Supabase), pas une intention.
// `cleaning_schedule` porte un `id` auto-incremente en plus de sa cle unique
// (date, property_id), et `today_selections` existait en base sans figurer ici.
// Un schema qui ment fait echouer les migrations en silence.

export const properties = pgTable(
	"properties",
	{
		id: text("id").primaryKey(),
		clerkId: text("clerk_id").notNull(),
		url: text("url").notNull(),
		listingData: json("listing_data").$type<Listing>(),
		views: integer("views").notNull().default(0),
		inquiries: integer("inquiries").notNull().default(0),
		pricePerNight: integer("price_per_night").notNull().default(0),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		keyboxCode: text("keybox_code"),
		driveUrl: text("drive_url"),
		comment: text("comment"),
		cleaningPrice: integer("cleaning_price").default(0)
	},
	(table) => {
		return {
			clerkIdIdx: index("clerk_id_idx").on(table.clerkId)
		}
	}
)

export const scrapingJobs = pgTable(
	"scraping_jobs",
	{
		id: text("id").primaryKey(),
		runId: text("run_id").notNull().unique(),
		propertyId: text("property_id")
			.references(() => properties.id, { onDelete: "cascade" })
			.notNull(),
		status: text("status", {
			enum: ["pending", "complete", "failed"]
		}).notNull(),
		url: text("url").notNull(),
		startedAt: timestamp("started_at").notNull(),
		completedAt: timestamp("completed_at"),
		error: text("error")
	},
	(table) => ({
		propertyIdIdx: index("property_id_idx").on(table.propertyId),
		runIdIdx: index("run_id_idx").on(table.runId)
	})
)

export const cleaningSchedule = pgTable(
	"cleaning_schedule",
	{
		id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
		date: date("date").notNull(),
		propertyId: text("property_id")
			.references(() => properties.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at").defaultNow()
	},
	(table) => ({
		datePropertyIdx: index("cleaning_schedule_date_property_id_key").on(
			table.date,
			table.propertyId
		)
	})
)

export const todaySelections = pgTable(
	"today_selections",
	{
		date: date("date").notNull(),
		propertyId: text("property_id")
			.references(() => properties.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at").defaultNow()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.date, table.propertyId] })
	})
)

// Types for type safety
export type Property = typeof properties.$inferSelect
export type NewProperty = typeof properties.$inferInsert
export type ScrapingJob = typeof scrapingJobs.$inferSelect
export type NewScrapingJob = typeof scrapingJobs.$inferInsert
export type CleaningSchedule = typeof cleaningSchedule.$inferSelect
export type TodaySelection = typeof todaySelections.$inferSelect