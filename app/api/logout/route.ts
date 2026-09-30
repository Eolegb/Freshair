import { NextResponse } from "next/server"
import { originePublique } from "@/lib/session"

// Efface le cookie de session. Accessible en GET : un simple lien suffit, pas
// besoin de JavaScript pour se deconnecter.
export async function GET(request: Request) {
	const reponse = NextResponse.redirect(new URL("/login", originePublique(request)), {
		status: 303
	})
	reponse.cookies.set("freshair_session", "", { path: "/", maxAge: 0 })
	return reponse
}