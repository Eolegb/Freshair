"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { ExploreProperty } from "@/lib/properties"
import { motion } from "framer-motion"
import { MapPin, Search, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function ExploreClient({ properties }: { properties: ExploreProperty[] }) {
	const [query, setQuery] = useState("")

	const filtered = properties.filter((p) => {
		if (!query) return true
		const q = query.toLowerCase()
		return (
			p.title.toLowerCase().includes(q) ||
			(p.address || "").toLowerCase().includes(q) ||
			p.location.toLowerCase().includes(q)
		)
	})

	return (
		<div>
			<div className="sticky top-12 z-40 bg-background border-b px-4 py-3">
				<div className="relative max-w-md mx-auto">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Rechercher un logement..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="pl-9 h-10 rounded-full bg-muted/50"
					/>
				</div>
			</div>

			<div className="px-4 pt-4">
				<p className="text-sm text-muted-foreground mb-4">
					{filtered.length} logement{filtered.length > 1 ? "s" : ""}
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filtered.map((property) => (
						<PropertyCard key={property.id} property={property} />
					))}
				</div>
			</div>
		</div>
	)
}

function PropertyCard({ property }: { property: ExploreProperty }) {
	return (
		<motion.div
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			transition={{ type: "spring", stiffness: 400, damping: 17 }}
		>
			<Link href={`/listing/${property.id}`}>
				<Card className="overflow-hidden">
					<AspectRatio ratio={16 / 9}>
						{property.mainImage ? (
							<Image
								src={property.mainImage}
								alt={property.title}
								fill
								className="object-cover"
							/>
						) : (
							<div className="w-full h-full bg-gray-200 flex items-center justify-center">
								<MapPin className="h-12 w-12 text-gray-400" />
							</div>
						)}
					</AspectRatio>
					<CardContent className="p-4">
						<h3 className="font-semibold line-clamp-1 text-sm">{property.title}</h3>
						<div className="mt-1 flex items-center text-gray-500 text-xs">
							<MapPin className="h-3 w-3 mr-1" />
							<span className="line-clamp-1">{property.address || property.location}</span>
						</div>
						<div className="mt-2 flex items-center justify-between text-xs">
							<div className="flex items-center gap-1 text-gray-600">
								<Users className="h-3 w-3" />
								<span>{property.capacity} voyageurs</span>
							</div>
							<div className="font-semibold">
								{property.pricePerNight}€ <span className="text-gray-500">prestation</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</Link>
		</motion.div>
	)
}
