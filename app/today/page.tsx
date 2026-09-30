import { getPropertiesForToday } from "@/lib/properties"
import { TodayClient } from "./_components/TodayClient"

export const dynamic = "force-dynamic"

// Pas de barre de titre ici : le layout racine en fournit deja une (`<Header />`,
// fixe, 48px). En ajouter une seconde en `sticky` creait deux bandeaux de meme
// hauteur au meme z-index, qui se recouvraient et masquaient la liste.
export default async function TodayPage() {
	const properties = await getPropertiesForToday()

	return <TodayClient properties={properties} />
}
