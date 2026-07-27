export default function ExploreLoading() {
	return (
		<div>
			<div className="sticky top-12 z-40 bg-background border-b px-4 py-3">
				<div className="relative max-w-md mx-auto">
					<div className="h-10 bg-muted animate-pulse rounded-full" />
				</div>
			</div>
			<div className="px-4 pt-4">
				<div className="h-4 bg-muted rounded w-24 mb-4 animate-pulse" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="rounded-xl overflow-hidden border">
							<div className="aspect-video bg-muted animate-pulse" />
							<div className="p-4 space-y-2">
								<div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
								<div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
