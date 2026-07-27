import type { Policies } from "@/data/types"
import { Check } from "lucide-react"

interface ThingsToKnowProps {
	policies: Policies
}

export function ThingsToKnow({ policies }: ThingsToKnowProps) {
	return (
		<div>
			<h2 className="text-2xl font-medium">Things to know</h2>
			<div className="mt-4 grid grid-cols-3 gap-8">
				{/* House Rules */}
				<div>
					<h3 className="font-medium mb-4">House rules</h3>
					<ul className="space-y-4">
						{policies.houseRules.sections.flatMap((section) =>
							section.rules.map((rule) => (
								<li
									key={rule.title}
									className="flex items-start gap-2 text-gray-600"
								>
									{rule.icon && (
										<span className="mt-1">
											<Check className="h-4 w-4" />
										</span>
									)}
									<span>{rule.title}</span>
								</li>
							))
						)}
					</ul>
				</div>

				{/* Safety */}
				<div>
					<h3 className="font-medium mb-4">Safety & property</h3>
					<ul className="space-y-4">
						{policies.safety.items.map((item) => (
							<li
								key={item.title}
								className="flex items-start gap-2 text-gray-600"
							>
								<span className="mt-1">
									<Check className="h-4 w-4" />
								</span>
								<span>{item.title}</span>
							</li>
						))}
					</ul>
				</div>

				{/* Cancellation */}
				<div>
					<h3 className="font-medium mb-4">Cancellation policy</h3>
					<p className="text-gray-600">{policies.cancellation.policy}</p>
				</div>
			</div>
		</div>
	)
}
