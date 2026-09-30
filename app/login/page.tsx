import { redirect } from "next/navigation"
import { cookies } from "next/headers"

// Page de connexion. Formule volontairement sans JavaScript : le formulaire est
// un envoi classique vers /api/login, qui pose le cookie et redirige.
export const dynamic = "force-dynamic"

export default async function LoginPage({
	searchParams
}: {
	searchParams: Promise<{ erreur?: string; suite?: string }>
}) {
	const { erreur, suite } = await searchParams

	// Deja connecte : inutile de redemander le mot de passe.
	const dejaLa = (await cookies()).get("freshair_session")?.value
	if (dejaLa) {
		const vers = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/today"
		redirect(vers)
	}

	return (
		<div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "calc(100dvh - 48px - 64px)" }}>
			<div className="w-full max-w-sm">
				<h1 className="text-2xl font-bold text-center text-primary mb-1">Freshair</h1>
				<p className="text-sm text-muted-foreground text-center mb-6">
					Gestion des logements
				</p>

				<form method="post" action="/api/login" className="space-y-3">
					<input
						type="password"
						name="mot_de_passe"
						required
						autoFocus
						autoComplete="current-password"
						placeholder="Mot de passe"
						className="w-full rounded-lg border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/40"
					/>
					{suite ? <input type="hidden" name="suite" value={suite} /> : null}
					<button
						type="submit"
						className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:opacity-90"
					>
						Entrer
					</button>
				</form>

				{erreur ? (
					<p className="mt-4 text-center text-sm text-destructive">
						Mot de passe incorrect.
					</p>
				) : null}
			</div>
		</div>
	)
}