import type { Host } from "@/data/types"
import { Check, MessageSquare, Shield, Star } from "lucide-react"
import Image from "next/image"

interface HostDetailsProps {
	host: Host
}

export function HostDetails({ host }: HostDetailsProps) {
	return (
		<div>
			<h2 className="text-2xl font-medium">Meet your hosts</h2>
			<div className="mt-6 space-y-6">
				{/* Host info and stats */}
				<div className="flex items-start gap-6">
					<div className="h-[150px] w-[150px] overflow-hidden rounded-full">
						<Image
							src={host.host.profilePicture}
							alt={host.host.name}
							width={150}
							height={150}
							className="h-full w-full object-cover"
						/>
					</div>
					<div className="space-y-4">
						<div>
							<h3 className="text-xl font-medium">{host.host.name}</h3>
							<p className="text-gray-500">
								Joined {host.host.stats.yearsHosting} years ago
							</p>
						</div>

						<div className="flex gap-4">
							<div className="flex items-center gap-2">
								<Star className="h-5 w-5" />
								<span>{host.host.stats.rating} Rating</span>
							</div>
							<div className="flex items-center gap-2">
								<MessageSquare className="h-5 w-5" />
								<span>{host.host.stats.reviews} Reviews</span>
							</div>
							{host.host.isVerified && (
								<div className="flex items-center gap-2">
									<Shield className="h-5 w-5" />
									<span>Identity verified</span>
								</div>
							)}
						</div>

						{/* Host highlights */}
						{host.highlights.length > 0 && (
							<div className="space-y-2">
								{host.highlights.map((highlight) => (
									<div
										key={highlight.title}
										className="flex items-center gap-2"
									>
										<Check className="h-5 w-5" />
										<span>{highlight.title}</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Host about section */}
				{host.about && (
					<div className="mt-6">
						<p className="text-gray-600 whitespace-pre-wrap">{host.about}</p>
					</div>
				)}

				{/* Co-hosts */}
				{host.cohosts.length > 0 && (
					<div className="mt-6">
						<h3 className="text-lg font-medium mb-4">Co-hosts</h3>
						<div className="flex gap-4">
							{host.cohosts.map((cohost) => (
								<div key={cohost.userId} className="flex items-center gap-2">
									<div className="h-10 w-10 overflow-hidden rounded-full">
										<Image
											src={cohost.profilePicture}
											alt={cohost.name}
											width={40}
											height={40}
											className="h-full w-full object-cover"
										/>
									</div>
									<span>{cohost.name}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
