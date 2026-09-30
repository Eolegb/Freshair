import { getPropertiesForToday } from "@/lib/properties"
import { TodayClient } from "./_components/TodayClient"

export const dynamic = "force-dynamic"

export default async function TodayPage() {
	const properties = await getPropertiesForToday()

	return (
		<div>
			<TodayClient properties={properties} />
		</div>
	)
}
