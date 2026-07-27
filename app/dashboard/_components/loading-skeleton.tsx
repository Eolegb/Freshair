import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PropertyCardSkeleton() {
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex flex-col gap-4">
					<div>
						<Skeleton className="h-6 w-3/4" />
						<Skeleton className="h-4 w-1/2 mt-2" />
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-12 mt-1" />
						</div>
						<div>
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-12 mt-1" />
						</div>
					</div>

					<div className="flex items-center gap-2 pt-2">
						<Skeleton className="h-9 w-32" />
						<div className="flex-1" />
						<Skeleton className="h-9 w-9" />
						<Skeleton className="h-9 w-9" />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
