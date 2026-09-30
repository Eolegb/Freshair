import { NextResponse, type NextRequest } from "next/server"
import { COOKIE_SESSION, cookieValide, secret } from "@/lib/session"

// Connexion simple : un mot de passe unique, echange contre un cookie signe.
// Aucune dependance externe. Clerk est ecarte parce que son instance de
// developpement bloquait toutes les requetes : elle passait en etat `Handshake`,
// ne trouvait pas de redirection a poser, levait « Clerk: handshake status
// without redirect », et Next 16 ne renvoyait alors jamais la reponse.

// Toujours joignables : la page de connexion, et les appels qui portent leur
// propre authentification (le webhook d'Apify a son secret a lui).
const LIBRES = [/^\/login\/?$/, /^\/api\/login\/?$/, /^\/api\/apify-webhook/]

export default function middleware(req: NextRequest) {
	const chemin = req.nextUrl.pathname

	if (LIBRES.some((motif) => motif.test(chemin))) {
		return NextResponse.next()
	}

	if (!secret()) {
		// Echec ferme : sans secret rien n'est verifiable, donc on refuse tout
		// plutot que d'ouvrir l'appli. Le message dit quoi corriger.
		console.error("APP_SESSION_SECRET manquant : toute requete est refusee")
		return new NextResponse("Configuration incomplete : APP_SESSION_SECRET absent.", {
			status: 500
		})
	}

	if (cookieValide(req.cookies.get(COOKIE_SESSION)?.value)) {
		return NextResponse.next()
	}

	const vers = req.nextUrl.clone()
	vers.pathname = "/login"
	vers.search = ""
	if (chemin !== "/") vers.searchParams.set("suite", chemin)
	return NextResponse.redirect(vers)
}

export const config = {
	// Runtime Node : `node:crypto` n'existe pas sur le runtime Edge, or la
	// signature du cookie en depend.
	runtime: "nodejs",
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)"
	]
}