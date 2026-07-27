import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog"
import type { Description } from "@/data/types"

interface AboutSpaceProps {
	description: Description
}

export function AboutSpace({ description }: AboutSpaceProps) {
	// Get the first section and the rest
	const [firstSection, ...remainingSections] = description.sections

	return (
		<div>
			<h2 className="text-2xl font-medium">À propos</h2>
			<div className="mt-4 space-y-4">
				{/* First section */}
				<div key={`section-${firstSection.content.substring(0, 20)}`}>
					{firstSection.title && (
						<h3 className="font-medium mb-2">{firstSection.title}</h3>
					)}
					<p
						className="whitespace-pre-wrap"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: content is pre-sanitized
						dangerouslySetInnerHTML={{ __html: firstSection.content }}
					/>
				</div>

				{/* Show more button and dialog */}
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline">Voir plus</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[768px] max-h-[80vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>À propos</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							{remainingSections.map((section) => (
								<div
									key={`section-${section.title ?? section.content.substring(0, 20)}`}
								>
									{section.title && (
										<h3 className="font-medium mb-2">{section.title}</h3>
									)}
									<p
										className="whitespace-pre-wrap"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: content is pre-sanitized
										dangerouslySetInnerHTML={{ __html: section.content }}
									/>
								</div>
							))}
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
