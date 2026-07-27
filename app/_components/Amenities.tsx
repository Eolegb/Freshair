import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import type { Amenities as AmenitiesType } from "@/data/types"
import { Check, X } from "lucide-react"

interface AmenitiesProps {
	amenities: AmenitiesType
}

export function Amenities({ amenities }: AmenitiesProps) {
	return (
		<div>
			<h2 className="text-2xl font-medium">Équipements</h2>
			<div className="mt-6 grid grid-cols-2 gap-4">
				{amenities.groups.slice(0, 6).map((group) => (
					<div
						key={group.title}
						className="flex items-center gap-2 text-gray-600"
					>
						<Check className="h-5 w-5" />
						{group.amenities[0].title}
					</div>
				))}
			</div>

			<Dialog>
				<DialogTrigger asChild>
					<Button variant="outline" className="mt-4">
						Voir les {amenities.count} équipements
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[768px] max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Équipements</DialogTitle>
					</DialogHeader>
					<div className="grid grid-cols-2 gap-8">
						{amenities.groups.map((group) => (
							<div key={group.title}>
								<h3 className="font-medium mb-2">{group.title}</h3>
								<ul className="space-y-2">
									{group.amenities.map((amenity) => (
										<li
											key={amenity.title}
											className="flex items-center gap-2 text-gray-600"
										>
											{amenity.available ? (
												<Check className="h-4 w-4" />
											) : (
												<X className="h-4 w-4" />
											)}
											<span>
												{amenity.title}
												{amenity.subtitle && (
													<span className="text-sm text-gray-500">
														· {amenity.subtitle}
													</span>
												)}
											</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
