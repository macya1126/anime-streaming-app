type Props = {
  id: number
  title: string
  year: string
  genre: string
  imageUrl: string
  backdropUrl?: string
  overview?: string
  services: string[]
  serviceLogos: { name: string; logoUrl: string }[]
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
  onClick?: (id: number) => void
}

export default function MovieCard({
  id, title, year, genre, imageUrl,
  isFavorite, onToggleFavorite, onClick
}: Props) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group flex-shrink-0 w-32 sm:w-40 md:w-44"
      onClick={() => onClick?.(id)}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(id) }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <span className="text-sm">{isFavorite ? '❤️' : '🤍'}</span>
        </button>
      </div>
      <div className="p-2">
        <p className="text-white text-[11px] font-bold leading-tight line-clamp-1">{title}</p>
        <p className="text-gray-500 text-[10px] mt-0.5">{year} · {genre}</p>
      </div>
    </div>
  )
}