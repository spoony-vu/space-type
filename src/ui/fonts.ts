export interface FontEntry { id: string; name: string; url: string }

const GH = 'https://raw.githubusercontent.com/google/fonts/main'

export const FONTS: FontEntry[] = [
  { id: 'archivo-black', name: 'Archivo Black', url: '/fonts/ArchivoBlack-Regular.ttf' },
  { id: 'space-mono', name: 'Space Mono', url: '/fonts/SpaceMono-Regular.ttf' },
  { id: 'anton', name: 'Anton', url: `${GH}/ofl/anton/Anton-Regular.ttf` },
  { id: 'bebas-neue', name: 'Bebas Neue', url: `${GH}/ofl/bebasneue/BebasNeue-Regular.ttf` },
  { id: 'bungee', name: 'Bungee', url: `${GH}/ofl/bungee/Bungee-Regular.ttf` },
  { id: 'monoton', name: 'Monoton', url: `${GH}/ofl/monoton/Monoton-Regular.ttf` },
  { id: 'rubik-mono-one', name: 'Rubik Mono One', url: `${GH}/ofl/rubikmonoone/RubikMonoOne-Regular.ttf` },
  { id: 'alfa-slab-one', name: 'Alfa Slab One', url: `${GH}/ofl/alfaslabone/AlfaSlabOne-Regular.ttf` },
  { id: 'abril-fatface', name: 'Abril Fatface', url: `${GH}/ofl/abrilfatface/AbrilFatface-Regular.ttf` },
  { id: 'righteous', name: 'Righteous', url: `${GH}/ofl/righteous/Righteous-Regular.ttf` },
  { id: 'major-mono', name: 'Major Mono Display', url: `${GH}/ofl/majormonodisplay/MajorMonoDisplay-Regular.ttf` },
  { id: 'vt323', name: 'VT323', url: `${GH}/ofl/vt323/VT323-Regular.ttf` },
]

export function fontById(id: string): FontEntry {
  return FONTS.find(f => f.id === id) ?? FONTS[0]
}
