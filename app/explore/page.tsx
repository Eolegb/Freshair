import { getExploreProperties } from "@/lib/properties"
import { Navbar } from "@/app/_components/Navbar"
import { ExploreClient } from "./_components/ExploreClient"

export const dynamic = "force-dynamic"

export default async function ExplorePage() {
	const properties = await getExploreProperties()

	return (
		<div>
			<Navbar />
			<ExploreClient properties={properties} />
		</div>
	)
}
