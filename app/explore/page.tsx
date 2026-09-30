import { getExploreProperties } from "@/lib/properties"
import { ExploreClient } from "./_components/ExploreClient"

export const dynamic = "force-dynamic"

export default async function ExplorePage() {
	const properties = await getExploreProperties()

	return (
		<div>
			<ExploreClient properties={properties} />
		</div>
	)
}
