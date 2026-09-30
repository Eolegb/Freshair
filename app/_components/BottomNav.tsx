"use client"

import { Home, Map } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
	const pathname = usePathname()

	const tabs = [
		{ href: "/explore", label: "Logements", icon: Home },
		{ href: "/today", label: "Aujourd'hui", icon: Map }
	]

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
			{/* h-[var(--nav-h)] : barre compacte (48px). Les items sont etires sur toute
			    la hauteur (flex-1) : la zone tactile reste >= 44px malgre la hauteur
			    reduite, et couvre toute la largeur de chaque onglet. */}
			<div className="flex h-[var(--nav-h)] items-stretch">
				{tabs.map((tab) => {
					const isActive =
						pathname === tab.href || pathname.startsWith(tab.href + "/")
					return (
						<Link
							key={tab.href}
							href={tab.href}
							prefetch
							className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
								isActive
									? "text-primary"
									: "text-muted-foreground"
							}`}
						>
							<tab.icon className={`h-[18px] w-[18px] ${isActive ? "stroke-[2.5]" : ""}`} />
							{tab.label}
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
