import { getPropertiesForToday } from "@/lib/properties"
import { Navbar } from "@/app/_components/Navbar"
import { TodayClient } from "./_components/TodayClient"

export const dynamic = "force-dynamic"

export default async function TodayPage() {
	const properties = await getPropertiesForToday()

	return (
		<div>
			<Navbar />
			<TodayClient properties={properties} />
		</div>
	)
}
