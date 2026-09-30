import { NextResponse } from "next/server"
import { originePublique } from "@/lib/session"

// Efface le cookie de session. Accessible en GET : un simple lien suffit, pas
// besoin de JavaScript pour se deconnecter.
export async function GET(request: Request) {
	// Un préchargement ne doit jamais déconnecter. Next précharge les <Link>,
	// Safari précharge au survol, un prerender peut partir tout seul : seules les
	// vraies navigations (Sec-Fetch-Dest: document) déconnectent. Sans l'en-tête
	// (vieux navigateur), on laisse passer.
	const destination = request.headers.get("sec-fetch-dest")
	const prefetched = request.headers.get("next-router-prefetch") === "1"
	const but = request.headers.get("sec-purpose") || request.headers.get("x-purpose") || ""
	if (prefetched || but.includes("prefetch") || but.includes("prerender") || (destination !== null && destination !== "document")) {
		return new NextResponse(null, { status: 204 })
	}

	const reponse = NextResponse.redirect(new URL("/login", originePublique(request)), {
		status: 303
	})
	reponse.cookies.set("freshair_session", "", { path: "/", maxAge: 0 })
	return reponse
}