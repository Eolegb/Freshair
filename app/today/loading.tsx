export default function TodayLoading() {
	return (
		<div className="flex flex-col" style={{ height: "calc(100vh - 48px - 64px)" }}>
			<div className="w-full flex-shrink-0 bg-muted animate-pulse" style={{ height: "40%" }} />
			<div className="flex-1 px-4 py-6 space-y-4">
				<div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="flex items-center gap-3 p-3">
							<div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
