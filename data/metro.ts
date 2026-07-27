export type MetroStation = {
	name: string
	lat: number
	lng: number
	line: "a" | "b" | "ab"
}

export const metroLineA: MetroStation[] = [
	{ name: "J.F. Kennedy", lat: 48.121299, lng: -1.711261, line: "a" },
	{ name: "Villejean-Université", lat: 48.121241, lng: -1.703929, line: "a" },
	{ name: "Pontchaillou", lat: 48.121557, lng: -1.693400, line: "a" },
	{ name: "Anatole France", lat: 48.118137, lng: -1.687600, line: "a" },
	{ name: "Sainte-Anne", lat: 48.114525, lng: -1.680509, line: "ab" },
	{ name: "République", lat: 48.109759, lng: -1.679182, line: "a" },
	{ name: "Charles de Gaulle", lat: 48.105460, lng: -1.676829, line: "a" },
	{ name: "Gares", lat: 48.103847, lng: -1.672245, line: "ab" },
	{ name: "Jacques Cartier", lat: 48.097543, lng: -1.675452, line: "a" },
	{ name: "Clemenceau", lat: 48.093480, lng: -1.674418, line: "a" },
	{ name: "Henri Fréville", lat: 48.087679, lng: -1.674816, line: "a" },
	{ name: "Italie", lat: 48.086564, lng: -1.667900, line: "a" },
	{ name: "Triangle", lat: 48.086437, lng: -1.660360, line: "a" },
	{ name: "Le Blosne", lat: 48.087732, lng: -1.654278, line: "a" },
	{ name: "La Poterie", lat: 48.087490, lng: -1.644573, line: "a" }
]

export const metroLineB: MetroStation[] = [
	{ name: "Saint-Jacques - Gaîté", lat: 48.092047, lng: -1.703620, line: "b" },
	{ name: "La Courrouze", lat: 48.096522, lng: -1.698399, line: "b" },
	{ name: "Cleunay", lat: 48.101002, lng: -1.706408, line: "b" },
	{ name: "Mabilais", lat: 48.105059, lng: -1.692651, line: "b" },
	{ name: "Colombier", lat: 48.105890, lng: -1.682154, line: "b" },
	{ name: "Gares", lat: 48.103847, lng: -1.672245, line: "ab" },
	{ name: "Saint-Germain", lat: 48.110616, lng: -1.676273, line: "b" },
	{ name: "Sainte-Anne", lat: 48.114525, lng: -1.680509, line: "ab" },
	{ name: "Jules Ferry", lat: 48.118659, lng: -1.670766, line: "b" },
	{ name: "Gros-Chêne", lat: 48.125093, lng: -1.664468, line: "b" },
	{ name: "Les Gayeulles", lat: 48.129395, lng: -1.657300, line: "b" },
	{ name: "Joliot-Curie - Chateaubriand", lat: 48.124113, lng: -1.651502, line: "b" },
	{ name: "Beaulieu - Université", lat: 48.122129, lng: -1.639116, line: "b" },
	{ name: "Atalante", lat: 48.127146, lng: -1.628023, line: "b" },
	{ name: "Cesson - Viasilva", lat: 48.131493, lng: -1.620061, line: "b" }
]

export const allMetroStations: MetroStation[] = [
	...metroLineA.filter(s => s.line === "a"),
	...metroLineB.filter(s => s.line === "b"),
	{ name: "Sainte-Anne", lat: 48.114525, lng: -1.680509, line: "ab" },
	{ name: "Gares", lat: 48.103847, lng: -1.672245, line: "ab" }
]

export function findNearestMetro(lat: number, lng: number): { station: MetroStation; dist: number } {
	let nearest = allMetroStations[0]
	let minDist = Infinity
	for (const s of allMetroStations) {
		const d = (s.lat - lat) ** 2 + (s.lng - lng) ** 2
		if (d < minDist) { minDist = d; nearest = s }
	}
	const R = 6371000
	const dLat = (nearest.lat - lat) * Math.PI / 180
	const dLng = (nearest.lng - lng) * Math.PI / 180
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(nearest.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
	const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
	return { station: nearest, dist }
}
