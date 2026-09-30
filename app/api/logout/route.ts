import { NextResponse } from "next/server"

// Efface le cookie de session. Accessible en GET : un simple lien suffit, pas
// besoin de JavaScript pour se deconnecter.
export async function GET(request: Request) {
	const reponse = NextResponse.redirect(new URL("/login", request.url), { status: 303 })
	reponse.cookies.set("freshair_session", "", { path: "/", maxAge: 0 })
	return reponse
}