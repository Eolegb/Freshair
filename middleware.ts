import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtected = createRouteMatcher(["/dashboard(.*)", "/api/nomad/today(.*)"])

export default clerkMiddleware(
	async (auth, req) => {
		if (isProtected(req)) await auth.protect()
	},
	// `debug` fait journaliser a Clerk chaque decision d'authentification. Sans lui
	// une requete suspendue ne laisse AUCUNE trace : le serveur accepte la connexion,
	// ne repond jamais, et le journal reste vide.
	{ debug: true }
)

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
