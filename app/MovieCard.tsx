type Props = {
  id: number
  title: string
  year: string
  genre: string
  imageUrl: string
  services: string[]
  serviceLogos: { name: string; logoUrl: string }[]
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
}

export default function MovieCard({
  id, title, year, genre, imageUrl, services, serviceLogos, isFavorite, onToggleFavorite
}: Props) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900 cursor-pointer group">

      {/* ポスター画像 */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* ハートボタン */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(id) }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
        >
          <span className="text-lg">{isFavorite ? '❤️' : '🤍'}</span>
        </button>
      </div>

      {/* テキスト情報 */}
      <div className="p-2">
        <p className="text-white text-xs font-bold leading-tight line-clamp-2">{title}</p>
        <p className="text-gray-400 text-[10px] mt-0.5">{year} · {genre}</p>

        {/* 配信サービスロゴ */}
        {serviceLogos.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {serviceLogos.map((s) => (
              <img
                key={s.name}
                src={s.logoUrl}
                alt={s.name}
                title={s.name}
                className="w-5 h-5 rounded object-cover"
              />
            ))}
          </div>
        )}

        {/* ロゴがない場合はテキストバッジ */}
        {serviceLogos.length === 0 && services.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {services.map((s) => (
              <span key={s} className="bg-gray-700 text-gray-300 text-[9px] px-1.5 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}