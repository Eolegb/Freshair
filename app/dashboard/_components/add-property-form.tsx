"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createProperty } from "@/lib/properties"
import { Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { z } from "zod"

// URL validation schema
const urlSchema = z
	.string()
	.url()
	.includes("airbnb.com/rooms/")
	.regex(/airbnb\.com\/rooms\/\d+/, "Must be a valid Airbnb listing URL")

export function AddPropertyForm() {
	const router = useRouter()
	const [url, setUrl] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()
	const { toast } = useToast()

	const handleSubmit = async (event?: React.FormEvent) => {
		if (event) event.preventDefault()
		setError(null)

		try {
			urlSchema.parse(url)
			startTransition(async () => {
				await createProperty(url)
				setUrl("")
				toast({
					title: "Property Added",
					description: "You'll receive an email when your listing is ready."
				})
				router.refresh()
			})
		} catch (e) {
			if (e instanceof z.ZodError) {
				setError("Please enter a valid Airbnb listing URL")
			} else {
				setError("An error occurred while adding the property")
			}
		}
	}

	return (
		<Card>
			<CardContent className="p-6">
				<h2 className="text-xl font-semibold mb-4">Add New Property</h2>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex gap-4">
						<Input
							placeholder="Enter your Airbnb listing URL"
							className="flex-1"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							disabled={isPending}
						/>
						<Button type="submit" disabled={isPending}>
							<Home className="mr-2 h-4 w-4" />
							{isPending ? "Adding..." : "Add Property"}
						</Button>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
				</form>
			</CardContent>
		</Card>
	)
}
