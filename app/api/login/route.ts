import { NextResponse } from "next/server"
import {
	COOKIE_SESSION,
	DUREE_SECONDES,
	adresseClient,
	bloque,
	destinationSure,
	fabriquerCookie,
	motDePasseCorrect,
	noterEchec,
	oublierEchecs,
	originePublique
} from "@/lib/session"

// Echange le mot de passe contre le cookie de session, puis renvoie la personne
// la ou elle voulait aller. Formule sans JavaScript cote client : le formulaire
// fonctionne meme si le script ne se charge pas.
export async function POST(request: Request) {
	const donnees = await request.formData()
	const saisi = String(donnees.get("mot_de_passe") || "")
	const destination = destinationSure(donnees.get("suite"))
	const adresse = adresseClient(request)

	// Verrou temporaire apres trop d'echecs : sur un acces public, un mot de
	// passe unique se casse par essais repetes.
	const attente = bloque(adresse)
	if (attente > 0) {
		const trop = new URL("/login", originePublique(request))
		trop.searchParams.set("bloque", String(attente))
		return NextResponse.redirect(trop, { status: 303 })
	}

	if (!motDePasseCorrect(saisi)) {
		noterEchec(adresse)
		const echec = new URL("/login", originePublique(request))
		echec.searchParams.set("erreur", "1")
		if (destination !== "/today") echec.searchParams.set("suite", destination)
		return NextResponse.redirect(echec, { status: 303 })
	}

	oublierEchecs(adresse)
	// Redirection construite sur l'adresse PUBLIQUE : derriere le funnel,
	// `request.url` vaut http://localhost:3001 et le navigateur suivrait vers une
	// adresse injoignable.
	const reponse = NextResponse.redirect(new URL(destination, originePublique(request)), {
		status: 303
	})
	reponse.cookies.set(COOKIE_SESSION, fabriquerCookie(), {
		httpOnly: true,
		sameSite: "lax",
		// `secure` seulement en HTTPS : le forcer ici ferait que le cookie ne
		// serait jamais enregistre sur un acces en http://, et la connexion
		// tournerait en boucle. En public l'acces est HTTPS, donc le cookie est
		// bien marque secure.
		secure: new URL(request.url).protocol === "https:",
		path: "/",
		maxAge: DUREE_SECONDES
	})
	return reponse
}