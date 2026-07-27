import { Separator } from "@/components/ui/separator"
import { getListing, incrementPropertyViews } from "@/lib/properties"
import { Gallery } from "../../_components/Gallery"
import { ListingHeader } from "../../_components/ListingHeader"
import { LocationSection } from "../../_components/Location"
import { Navbar } from "../../_components/Navbar"
import { PropertyInfoCard } from "../../_components/PropertyInfoCard"

type Params = Promise<{ id: string }>

export default async function ListingPage({ params }: { params: Params }) {
	const listing = await getListing((await params).id)

	await incrementPropertyViews((await params).id)

	if (!listing) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<main className="flex-1 container mx-auto px-4 flex items-center justify-center">
					<div className="text-center">
						<h1 className="text-2xl font-semibold mb-4">Logement introuvable</h1>
						<p className="text-gray-600">
							Ce logement n'existe pas ou a été supprimé.
						</p>
					</div>
				</main>
			</div>
		)
	}

	const allImages = listing.data.gallery.rooms.flatMap((room) => room.images)
	const address = listing.data.location?.address || listing.data.location?.subtitle || null
	const locationTitle = listing.data.location?.title || ""
	const lat = listing.data.location?.coordinates?.lat ?? 48.1173
	const lng = listing.data.location?.coordinates?.lng ?? -1.6778

	return (
		<div>
			<Navbar />
			<main className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 2xl:px-40 pb-20 md:pb-10">
				<h1 className="text-2xl font-semibold pt-6">{listing.data.h1Title}</h1>
				<Gallery
					images={allImages}
					className="mt-4 max-h-[600px] overflow-hidden"
				/>
				<div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="col-span-1 lg:col-span-2">
						<ListingHeader overview={listing.data.overview} />
						<Separator className="my-6" />
						<LocationSection location={listing.data.location} />
					</div>
					<div className="hidden lg:block">
						<PropertyInfoCard
							propertyId={(await params).id}
							address={address}
							locationTitle={locationTitle}
							pricePerNight={listing.pricePerNight}
							keyboxCode={listing.keyboxCode}
							lat={lat}
							lng={lng}
							driveUrl={listing.driveUrl}
							comment={listing.comment}
						/>
					</div>
				</div>
				<div className="lg:hidden mt-6">
					<PropertyInfoCard
						propertyId={(await params).id}
						address={address}
						locationTitle={locationTitle}
						pricePerNight={listing.pricePerNight}
						keyboxCode={listing.keyboxCode}
						lat={lat}
						lng={lng}
						driveUrl={listing.driveUrl}
						comment={listing.comment}
					/>
				</div>
			</main>
		</div>
	)
}
