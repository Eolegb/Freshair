import { Suspense } from "react"
import { Navbar } from "../_components/Navbar"
import { AddPropertyForm } from "./_components/add-property-form"
import { PropertyCardSkeleton } from "./_components/loading-skeleton"
import { PropertiesList } from "./_components/properties-list"

export default function Dashboard() {
	return (
		<div>
			<Navbar />
			<main className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 2xl:px-40">
				{/* Welcome Section */}
				<section className="py-8">
					<h1 className="text-3xl font-bold">Welcome back! 👋</h1>
					<p className="mt-2 text-gray-600">
						Manage your properties and track their performance
					</p>
				</section>

				{/* Add Property Section */}
				<section className="py-6">
					<AddPropertyForm />
				</section>

				{/* Properties List Section */}
				<section className="py-6">
					<h2 className="text-xl font-semibold mb-4">Your Properties</h2>
					<Suspense
						fallback={
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<PropertyCardSkeleton />
								<PropertyCardSkeleton />
								<PropertyCardSkeleton />
							</div>
						}
					>
						<PropertiesList />
					</Suspense>
				</section>
			</main>
		</div>
	)
}
