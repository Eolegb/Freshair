import { NextResponse } from "next/server"
import { COOKIE_SESSION, DUREE_SECONDES, destinationSure, fabriquerCookie, motDePasseCorrect } from "@/lib/session"

// Echange le mot de passe contre le cookie de session, puis renvoie la personne
// la ou elle voulait aller. Formule sans JavaScript cote client : le formulaire
// fonctionne meme si le script ne se charge pas.
export async function POST(request: Request) {
	const donnees = await request.formData()
	const saisi = String(donnees.get("mot_de_passe") || "")
	const destination = destinationSure(donnees.get("suite"))

	if (!motDePasseCorrect(saisi)) {
		const echec = new URL("/login", request.url)
		echec.searchParams.set("erreur", "1")
		if (destination !== "/today") echec.searchParams.set("suite", destination)
		return NextResponse.redirect(echec, { status: 303 })
	}

	const reponse = NextResponse.redirect(new URL(destination, request.url), { status: 303 })
	reponse.cookies.set(COOKIE_SESSION, fabriquerCookie(), {
		httpOnly: true,
		sameSite: "lax",
		// `secure` seulement en HTTPS : le forcer ici ferait que le cookie ne
		// serait jamais enregistre sur l'acces actuel en http://, et la connexion
		// tournerait en boucle.
		secure: new URL(request.url).protocol === "https:",
		path: "/",
		maxAge: DUREE_SECONDES
	})
	return reponse
}