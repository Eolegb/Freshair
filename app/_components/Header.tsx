"use client"

import Link from "next/link"

// Plus de composants Clerk ici : l'instance Clerk du projet est une instance de
// developpement (cle pk_test_), et ses composants cote navigateur declenchent la
// meme poignee de main qui bloquait deja le serveur. La connexion est desormais
// un simple mot de passe, verifie par le middleware.
export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between bg-background/95 backdrop-blur border-b safe-area-top px-4">
			<div className="w-8" />
			<Link href="/explore" className="text-lg font-bold tracking-tight text-primary">
				Freshair
			</Link>
			<div className="flex items-center gap-3 w-8 justify-end">
				{/* <a> et non <Link> : un <Link> est préchargé par Next au simple
				    affichage de la page, ce qui déclenchait GET /api/logout et
				    détruisait la session dès l'arrivée sur n'importe quel écran. */}
				<a
					href="/api/logout"
					className="text-xs text-muted-foreground hover:text-foreground"
					title="Se déconnecter"
				>
					Quitter
				</a>
			</div>
		</header>
	)
}