import { Toaster } from "@/components/ui/toaster"
import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata, Viewport } from "next"
import { BottomNav } from "./_components/BottomNav"
import "./globals.css"

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover"
}

export const metadata: Metadata = {
	title: "Freshair",
	description: "Gestion de logements",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Freshair"
	},
	formatDetection: {
		telephone: false
	},
	icons: [
		{
			rel: "icon",
			type: "image/jpeg",
			url: "/favicon.jpg"
		},
		{
			rel: "apple-touch-icon",
			url: "/favicon.jpg"
		}
	]
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<ClerkProvider>
			<html lang="fr">
				<head>
					<link rel="stylesheet" href="https://use.typekit.net/gnn8txw.css" />
					<meta name="apple-mobile-web-app-capable" content="yes" />
					<link rel="manifest" href="/manifest.json" />
				</head>
				<body className="pb-16">
					{children}
					<BottomNav />
					<Toaster />
				</body>
			</html>
		</ClerkProvider>
	)
}
