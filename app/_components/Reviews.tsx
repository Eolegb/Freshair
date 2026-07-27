import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import type { Review } from "@/data/types"
import { Star } from "lucide-react"
import { ReviewCard } from "./ReviewCard"

interface ReviewsProps {
	reviews: Review[]
	rating: number | null
}

export function Reviews({ reviews, rating }: ReviewsProps) {
	if (!rating || reviews.length === 0) {
		return null
	}

	return (
		<div>
			<h2 className="text-2xl font-medium">Reviews</h2>
			<div className="mt-4">
				<div className="flex items-center gap-2">
					<Star className="h-5 w-5 fill-current" />
					<span className="font-medium">{rating}</span>
					<span className="text-gray-500">·</span>
					<span className="text-gray-500">{reviews.length} reviews</span>
				</div>

				<div className="mt-6 grid grid-cols-2 gap-6">
					{reviews.slice(0, 6).map((review) => (
						<ReviewCard key={review.id} review={review} />
					))}
				</div>

				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline" className="mt-6">
							Show all {reviews.length} reviews
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[768px] max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>
								<div className="flex items-center gap-2">
									<Star className="h-5 w-5 fill-current" />
									<span>{rating}</span>
									<span className="text-gray-500">·</span>
									<span className="text-gray-500">
										{reviews.length} reviews
									</span>
								</div>
							</DialogTitle>
						</DialogHeader>
						<div className="grid grid-cols-1 gap-8">
							{reviews.map((review) => (
								<ReviewCard
									key={review.id}
									review={review}
									showFullComment={true}
								/>
							))}
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
