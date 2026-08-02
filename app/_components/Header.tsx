"use client"

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import Link from "next/link"

export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between bg-background/95 backdrop-blur border-b safe-area-top px-4">
			<div className="w-8" />
			<Link href="/explore" className="text-lg font-bold tracking-tight text-primary">
				Freshair
			</Link>
			<div className="flex items-center gap-2">
				<SignedIn>
					<UserButton
						appearance={{
							elements: {
								avatarBox: "h-7 w-7"
							}
						}}
					/>
				</SignedIn>
				<SignedOut>
					<SignInButton mode="modal">
						<button type="button" className="text-sm font-medium text-primary hover:underline">
							Connexion
						</button>
					</SignInButton>
				</SignedOut>
			</div>
		</header>
	)
}
