interface ListingHeaderProps {
	overview: {
		title: string
		capacity: number
	}
}

export function ListingHeader({ overview }: ListingHeaderProps) {
	const parts = overview.title.split(" · ").filter(Boolean)

	return (
		<div>
			<h3 className="text-base text-gray-500">
				{parts.join(" · ")}
			</h3>
		</div>
	)
}
