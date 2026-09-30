import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { readFileSync, renameSync, writeFileSync } from "node:fs"

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

// ---------------------------------------------------------------------------
// Limitation des tentatives de connexion.
//
// Des que l'appli est joignable publiquement, un mot de passe unique devient
// cassable par force brute : il suffit d'essayer en boucle. On compte donc les
// echecs par adresse et on ferme temporairement la porte.
//
// L'etat vit dans un FICHIER, pas dans une variable de module : Next 16
// reinstancie le module a chaque requete, donc une Map en memoire repart de zero
// a chaque essai et ne bloque jamais rien. Verifie : « table=1 » a chaque appel.
// Une variable de module n'est pas un stockage partage ici.
const TENTATIVES_MAX = 5
const BLOCAGE_MS = 10 * 60 * 1000
const FICHIER_ECHECS = "/tmp/freshair-echecs.json"

type Etat = Record<string, { compte: number; jusqua: number }>

function lireEtat(): Etat {
	try {
		return JSON.parse(readFileSync(FICHIER_ECHECS, "utf8")) as Etat
	} catch {
		return {}
	}
}

function ecrireEtat(e: Etat): void {
	try {
		// Ecriture par fichier temporaire + renommage : un lecteur concurrent ne
		// tombe jamais sur un fichier a moitie ecrit.
		const temporaire = `${FICHIER_ECHECS}.tmp`
		writeFileSync(temporaire, JSON.stringify(e))
		renameSync(temporaire, FICHIER_ECHECS)
	} catch (erreur) {
		// Si l'etat ne peut pas etre ecrit, la protection est inoperante : le
		// dire, sinon elle semble en place sans rien bloquer.
		console.error("[connexion] etat des echecs NON ENREGISTRE", erreur)
	}
}

export function bloque(adresse: string): number {
	const e = lireEtat()[adresse]
	if (!e) return 0
	const reste = e.jusqua - Date.now()
	if (reste <= 0) return 0
	return Math.ceil(reste / 60000)
}

export function noterEchec(adresse: string): void {
	const etat = lireEtat()
	// Menage au passage : la table ne doit pas grossir indefiniment sur une
	// appli exposee.
	const maintenant = Date.now()
	for (const [k, v] of Object.entries(etat)) if (v.jusqua < maintenant && v.jusqua > 0) delete etat[k]

	const e = etat[adresse] || { compte: 0, jusqua: 0 }
	e.compte += 1
	if (e.compte >= TENTATIVES_MAX) {
		e.jusqua = Date.now() + BLOCAGE_MS
		e.compte = 0
	}
	etat[adresse] = e
	ecrireEtat(etat)
	console.log(
		`[connexion] echec depuis ${adresse} : ${e.compte} echec(s), entrees=${Object.keys(etat).length}` +
			(e.jusqua > maintenant ? ", verrou pose" : "")
	)
}

export function oublierEchecs(adresse: string): void {
	const etat = lireEtat()
	delete etat[adresse]
	ecrireEtat(etat)
}

// Adresse publique telle que la voit le client. Derriere Tailscale serve/funnel,
// `request.url` porte l'adresse d'ecoute (http://localhost:3001) : s'en servir
// pour construire une redirection envoie le navigateur sur une adresse qui
// n'existe pas chez lui. L'en-tete Host, lui, est celui de la requete d'origine.
export function originePublique(req: Request): string {
	const entetes = req.headers
	const proto = (entetes.get("x-forwarded-proto") || "").split(",")[0].trim() || "http"
	const hote = entetes.get("x-forwarded-host") || entetes.get("host") || "localhost"
	return `${proto}://${hote}`
}

// Derriere Tailscale serve/funnel, l'adresse reelle arrive dans x-forwarded-for.
export function adresseClient(req: Request): string {
	const entete = req.headers.get("x-forwarded-for") || ""
	return entete.split(",")[0].trim() || req.headers.get("x-real-ip") || "inconnue"
}