import type { Location } from "@/data/types"
import { Check } from "lucide-react"
import { MapSection } from "./MapSection"

interface LocationSectionProps {
	location: Location
}

export function LocationSection({ location }: LocationSectionProps) {
	return (
		<div>
			<h2 className="text-2xl font-medium">Localisation</h2>
			<div className="mt-4">
				<h3 className="font-medium">{location.subtitle}</h3>

				<MapSection
					coordinates={{
						latitude: location.coordinates.lat,
						longitude: location.coordinates.lng
					}}
				/>

				{location.locationDetails.full.map((detail) => (
					<div key={detail.id} className="mt-4">
						{detail.title && (
							<h3 className="font-medium mb-2">{detail.title}</h3>
						)}
						{detail.content && (
							<p
								className="text-gray-600"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: content is pre-sanitized
								dangerouslySetInnerHTML={{ __html: detail.content }}
							/>
						)}
					</div>
				))}

				{location.verification?.isVerified && (
					<div className="mt-4 flex items-center gap-2 text-gray-600">
						<Check className="h-5 w-5" />
						<span>{location.verification.helpText}</span>
					</div>
				)}

				{location.disclaimer && (
					<p className="mt-4 text-sm text-gray-500">{location.disclaimer}</p>
				)}
			</div>
		</div>
	)
}
