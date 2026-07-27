"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

interface GalleryProps {
	images: {
		src: string
		caption: string | null
		aspectRatio: number
	}[]
	className?: string
}

export function Gallery({ images, className }: GalleryProps) {
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

	const close = useCallback(() => setLightboxIndex(null), [])
	const prev = useCallback(() => setLightboxIndex(i => i !== null ? (i - 1 + images.length) % images.length : null), [images.length])
	const next = useCallback(() => setLightboxIndex(i => i !== null ? (i + 1) % images.length : null), [images.length])

	useEffect(() => {
		if (lightboxIndex === null) return
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") close()
			if (e.key === "ArrowLeft") prev()
			if (e.key === "ArrowRight") next()
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [lightboxIndex, close, prev, next])

	if (!images || images.length === 0) {
		return (
			<div className={cn("rounded-lg bg-gray-100 flex items-center justify-center h-64", className)}>
				<span className="text-gray-400">Aucune photo disponible</span>
			</div>
		)
	}

	const horizontalImage = images.reduce((best, current) => {
		const targetRatio = 2
		const bestDiff = Math.abs(best.aspectRatio - targetRatio)
		const currentDiff = Math.abs(current.aspectRatio - targetRatio)
		return currentDiff < bestDiff ? current : best
	}, images[0])

	const mainIndex = images.indexOf(horizontalImage)
	const remainingImages = images.filter((_, i) => i !== mainIndex).slice(0, 6)

	return (
		<>
			<div className={cn("grid grid-cols-4 gap-2", className)}>
				<div className="col-span-2 cursor-pointer" onClick={() => setLightboxIndex(mainIndex)}>
					<AspectRatio ratio={2 / 1} className="overflow-hidden rounded-l-lg">
						<Image src={horizontalImage.src} alt={horizontalImage.caption || "Photo"} fill className="object-cover hover:scale-105 transition-transform duration-300" />
					</AspectRatio>
				</div>
				{remainingImages.map((image) => {
					const idx = images.indexOf(image)
					return (
						<div key={image.src} className="cursor-pointer" onClick={() => setLightboxIndex(idx)}>
							<AspectRatio ratio={1} className="overflow-hidden">
								<Image src={image.src} alt={image.caption || "Photo"} fill className="object-cover hover:scale-105 transition-transform duration-300" />
							</AspectRatio>
						</div>
					)
				})}
			</div>

			{lightboxIndex !== null && (
				<div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={close}>
					<button type="button" className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2" onClick={close}>
						<X className="h-6 w-6" />
					</button>

					<button
						type="button"
						className="absolute left-4 text-white/60 hover:text-white z-10 p-2"
						onClick={(e) => { e.stopPropagation(); prev() }}
					>
						<ChevronLeft className="h-8 w-8" />
					</button>

					<div className="relative w-full h-full max-w-5xl max-h-[85vh] m-8" onClick={(e) => e.stopPropagation()}>
						<Image
							src={images[lightboxIndex].src}
							alt={images[lightboxIndex].caption || "Photo"}
							fill
							className="object-contain"
							sizes="100vw"
							priority
						/>
					</div>

					<button
						type="button"
						className="absolute right-4 text-white/60 hover:text-white z-10 p-2"
						onClick={(e) => { e.stopPropagation(); next() }}
					>
						<ChevronRight className="h-8 w-8" />
					</button>

					<div className="absolute bottom-4 text-white/60 text-sm">
						{lightboxIndex + 1} / {images.length}
					</div>
				</div>
			)}
		</>
	)
}
