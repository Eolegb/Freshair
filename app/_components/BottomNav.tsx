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
			<div className="flex h-16 items-center justify-around">
				{tabs.map((tab) => {
					const isActive =
						pathname === tab.href || pathname.startsWith(tab.href + "/")
					return (
						<Link
							key={tab.href}
							href={tab.href}
							prefetch
							className={`flex flex-col items-center gap-1 px-6 py-2 text-xs font-medium transition-colors ${
								isActive
									? "text-primary"
									: "text-muted-foreground"
							}`}
						>
							<tab.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
							{tab.label}
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
