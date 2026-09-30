import { createHash, createHmac, timingSafeEqual } from "node:crypto"

// Logique de session partagee entre le middleware et la route de connexion.
// Elle vit ici et non dans middleware.ts : Next ne l'expose pas comme module
// importable, alors que les deux en ont besoin.

export const COOKIE_SESSION = "freshair_session"
export const DUREE_SECONDES = 180 * 24 * 3600

// Comparaison a duree constante sur des empreintes de taille fixe : ni la
// longueur ni le contenu ne fuit par le temps de reponse.
function egalConstant(a: string, b: string): boolean {
	const ha = createHash("sha256").update(a).digest()
	const hb = createHash("sha256").update(b).digest()
	return timingSafeEqual(ha, hb)
}

function signer(charge: string, cle: string): string {
	return createHmac("sha256", cle).update(charge).digest("hex")
}

export function secret(): string {
	return process.env.APP_SESSION_SECRET || ""
}

// Le cookie porte sa date d'expiration ET une signature HMAC calculee avec un
// secret du serveur. Sans ce secret on ne peut pas fabriquer un cookie valide :
// c'est ce qui empeche de contourner la connexion en l'ecrivant a la main.
export function fabriquerCookie(): string {
	const expiration = Math.floor(Date.now() / 1000) + DUREE_SECONDES
	const charge = String(expiration)
	return `${charge}.${signer(charge, secret())}`
}

export function cookieValide(valeur: string | undefined): boolean {
	if (!valeur || !secret()) return false
	const [charge, signature] = valeur.split(".")
	if (!charge || !signature) return false
	if (!egalConstant(signature, signer(charge, secret()))) return false
	const expiration = Number.parseInt(charge, 10)
	return Number.isFinite(expiration) && expiration * 1000 > Date.now()
}

export function motDePasseCorrect(saisi: string): boolean {
	const attendu = process.env.APP_PASSWORD || ""
	if (!attendu || !saisi) return false
	return egalConstant(saisi, attendu)
}

// N'accepte qu'un chemin interne : une valeur libre permettrait de renvoyer
// ailleurs (redirection ouverte).
export function destinationSure(suite: unknown, defaut = "/today"): string {
	const s = typeof suite === "string" ? suite : ""
	return s.startsWith("/") && !s.startsWith("//") ? s : defaut
}