"use client"
import Link from "next/link"

export function Navbar() {
	return (
		<nav className="border-b sticky top-0 bg-background z-50">
			<div className="container mx-auto flex h-12 items-center justify-center px-4">
				<Link
					href="/explore"
					className="font-display text-xl font-bold tracking-tight"
				>
					<span className="text-foreground">Fresh</span>
					<span className="text-primary">air</span>
				</Link>
			</div>
		</nav>
	)
}
