"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from "@/components/ui/tooltip"
import type { VisualProperty } from "@/lib/properties"
import { deleteProperty, updatePropertyPrice } from "@/lib/properties"
import { motion } from "framer-motion"
import { Home, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

function PriceInput({
	propertyId,
	initialPrice
}: {
	propertyId: string
	initialPrice: number
}) {
	const [localPrice, setLocalPrice] = useState(initialPrice)

	const handlePriceUpdate = (newPrice: number) => {
		if (!Number.isNaN(newPrice) && newPrice !== initialPrice) {
			updatePropertyPrice(propertyId, newPrice)
			setLocalPrice(newPrice)
		}
	}

	return (
		<Input
			type="number"
			min="0"
			value={localPrice || ""}
			onChange={(e) => {
				e.stopPropagation()
				setLocalPrice(Number(e.target.value))
			}}
			onBlur={() => handlePriceUpdate(localPrice)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					e.currentTarget.blur()
				}
			}}
			onMouseDown={(e) => e.stopPropagation()}
			onClick={(e) => e.stopPropagation()}
			onFocus={(e) => e.stopPropagation()}
			className="w-full"
		/>
	)
}

export function PropertyCard({ property }: { property: VisualProperty }) {
	const router = useRouter()

	const handleCardClick = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement
		if (target.closest("button") || target.closest("input")) {
			return
		}

		if (property.status === "loaded") {
			window.open(property.url, "_blank")
		}
	}

	return (
		<motion.div
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			transition={{ type: "spring", stiffness: 400, damping: 17 }}
			onClick={handleCardClick}
		>
			<Card
				className={`${
					property.status === "loaded"
						? "cursor-pointer hover:shadow-lg transition-shadow"
						: "opacity-50"
				}`}
			>
				<CardContent className="p-6">
					<div className="flex flex-col gap-4">
						{/* Title, Location, and Top Buttons */}
						<div className="flex justify-between items-start">
							<div>
								<h3 className="font-semibold">
									{property.status === "loaded"
										? property.title
										: "Property is loading..."}
								</h3>
								<p className="text-sm text-gray-500">
									{property.status === "loaded"
										? property.location
										: "Check back soon!"}
								</p>
							</div>
							<TooltipProvider>
								<div className="flex gap-2">
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												onClick={(e) => {
													e.stopPropagation()
													window.open(property.url, "_blank")
												}}
												className="text-[#FF385C] hover:text-[#FF385C] hover:bg-[#FF385C]/10"
											>
												<Home className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Open Airbnb listing</p>
										</TooltipContent>
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												onClick={async (e) => {
													e.stopPropagation()
													if (
														window.confirm(
															"Are you sure you want to delete this property?"
														)
													) {
														await deleteProperty(property.id)
														router.refresh()
													}
												}}
												disabled={property.status === "pending"}
												className={
													property.status === "pending"
														? "opacity-50 cursor-not-allowed"
														: ""
												}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Delete property</p>
										</TooltipContent>
									</Tooltip>
								</div>
							</TooltipProvider>
						</div>

						{/* Stats Grid */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-500">Views</p>
								<p className="text-lg font-semibold">
									{property.status === "loaded" ? property.views : "—"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-500">Inquiries</p>
								<p className="text-lg font-semibold">
									{property.status === "loaded" ? property.inquiries : "—"}
								</p>
							</div>
						</div>

						{/* Price Input */}
						<div>
							<p className="text-sm text-gray-500">Price per night</p>
							<PriceInput
								propertyId={property.id}
								initialPrice={property.pricePerNight}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	)
}
