import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

const AUTH_TOKEN = "nomad-api-secret-2026"

// GET /api/nomad/today?date=2026-07-28 — récupère les prestations du jour
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (token !== AUTH_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
  
  const result = await db.execute(sql`
    SELECT p.id, (p.listing_data::json->'data'->>'h1Title') as title, p.cleaning_price
    FROM cleaning_schedule cs
    JOIN properties p ON cs.property_id = p.id
    WHERE cs.date = ${date}::date
    ORDER BY p.cleaning_price DESC
  `)
  
  return NextResponse.json({ date, prestations: result.rows })
}

// POST /api/nomad/today — définit les prestations d'un jour
export async function POST(request: Request) {
  const body = await request.json()
  if (body.token !== AUTH_TOKEN) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const { date, property_ids } = body
  if (!date || !property_ids) return NextResponse.json({ error: "Missing date/property_ids" }, { status: 400 })
  
  // Supprimer les anciennes et ajouter les nouvelles
  await db.execute(sql`DELETE FROM cleaning_schedule WHERE date = ${date}::date`)
  
  for (const pid of property_ids) {
    await db.execute(sql`INSERT INTO cleaning_schedule (date, property_id) VALUES (${date}::date, ${pid}) ON CONFLICT DO NOTHING`)
  }
  
  return NextResponse.json({ ok: true, count: property_ids.length })
}
