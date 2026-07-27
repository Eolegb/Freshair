import type { Review } from "@/data/types"
import { Star } from "lucide-react"
import Image from "next/image"

interface ReviewCardProps {
	review: Review
	showFullComment?: boolean
}

export function ReviewCard({
	review,
	showFullComment = false
}: ReviewCardProps) {
	return (
		<div className="space-y-4">
			<div className="flex gap-4">
				<div className="h-10 w-10 overflow-hidden rounded-full">
					<Image
						src={review.reviewer.photo}
						alt={review.reviewer.name}
						width={40}
						height={40}
						className="h-full w-full object-cover"
					/>
				</div>
				<div>
					<h3 className="font-medium">{review.reviewer.name}</h3>
					<div className="flex items-center gap-1 text-sm text-gray-500">
						<div className="flex">
							{[...Array(5)].map((_, i) => (
								<Star
									key={`${review.id}-star-${i}`}
									className={`h-3 w-3 ${
										i < review.rating
											? "fill-current text-primary"
											: "text-gray-200"
									}`}
								/>
							))}
						</div>
						<span>·</span>
						<span>{review.date}</span>
					</div>
				</div>
			</div>
			<p
				className={`text-gray-600 ${
					showFullComment ? "whitespace-pre-wrap" : "line-clamp-3"
				}`}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: content is pre-sanitized
				dangerouslySetInnerHTML={{ __html: review.comment }}
			/>
			{review.response && showFullComment && (
				<div className="mt-4 pl-4 border-l-2 border-gray-200">
					<p className="font-medium">Response from host:</p>
					<p className="mt-1 text-gray-600">{review.response}</p>
				</div>
			)}
		</div>
	)
}
