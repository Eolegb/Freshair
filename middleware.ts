import { NextResponse } from "next/server"

// ============================================================================
// ATTENTION — CE MIDDLEWARE NE PROTEGE PLUS RIEN, VOLONTAIREMENT ET TEMPORAIREMENT
//
// Pourquoi : l'appli utilise une instance Clerk de DEVELOPPEMENT (cle `pk_test_`).
// Sur un serveur, toute requete sans le cookie « dev-browser » de Clerk fait
// basculer son etat en `Handshake`. Le middleware de Clerk cherche alors une
// redirection a poser ; quand il n'en trouve pas, il LEVE
// « Clerk: handshake status without redirect » — et Next 16 ne renvoie jamais la
// reponse : la connexion reste ouverte, zero octet, aucune erreur au journal.
// Verifie : avec Clerk, /today, /explore et l'API restaient suspendus ; en
// retirant Clerk, tout repond en moins de 300 ms.
//
// Consequence : la protection des pages se fait desormais par l'acces lui-meme.
// L'appli est liee a l'IP Tailscale, donc seule Eole (et ses appareils du
// tailnet) peut l'atteindre. Elle n'est PAS exposée publiquement.
//
// Pour retablir Clerk : passer l'instance Clerk en PRODUCTION (cle `pk_live_`,
// ce qui exige un domaine a soi et des enregistrements DNS), puis restaurer le
// bloc d'origine, conserve ci-dessous.
//
//   const isProtected = createRouteMatcher(["/dashboard(.*)", "/api/nomad/today(.*)"])
//   export default clerkMiddleware(async (auth, req) => {
//     if (isProtected(req)) await auth.protect()
//   })
// ============================================================================
export default function middleware() {
	return NextResponse.next()
}

// Runtime Node explicite. Par defaut le middleware part sur le runtime Edge, ou
// Clerk tourne dans un bac a sable : ici il s'y bloquait, et TOUTE requete passant
// par le middleware restait suspendue (accueil, /today, /api) alors que les
// fichiers statiques, exclus du matcher, repondaient normalement. Meme code, sans
// le bac a sable.
export const config = {
	runtime: "nodejs",
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)"
	]
}
