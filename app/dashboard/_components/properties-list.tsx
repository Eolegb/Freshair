import { Card, CardDescription, CardHeader } from "@/components/ui/card"
// This is a Server Component (no 'use client' directive)
import { getProperties } from "@/lib/properties"
import { Ghost } from "lucide-react"
import { PropertyCard } from "./property-card"

export async function PropertiesList() {
	const properties = await getProperties()

	if (properties.length === 0) {
		return (
			<Card className="border-dashed">
				<CardHeader className="space-y-4 flex items-center justify-center text-center">
					<Ghost className="w-12 h-12 text-muted-foreground" />
					<CardDescription>
						No properties found. Add your first property to get started.
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{properties.map((property) => (
				<PropertyCard key={property.id} property={property} />
			))}
		</div>
	)
}
