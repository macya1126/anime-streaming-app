'use client'

import { useState, useEffect } from 'react'
import MovieCard from './MovieCard'

type Page = 'home' | 'series' | 'movies' | 'mylist' | 'trending'

type ServiceLogo = { name: string; logoUrl: string }

type Movie = {
  id: number
  title: string
  year: string
  genre: string
  imageUrl: string
  backdropUrl: string
  overview: string
  services: string[]
  serviceLogos: ServiceLogo[]
}

const API_KEY = 'aaf4645e0eb5029750aea69faec3c126'

function normalizeServiceName(name: string): string {
  if (name.includes('Netflix')) return 'Netflix'
  if (name.includes('Amazon') || name.includes('Prime')) return 'Prime'
  if (name.includes('Disney')) return 'Disney+'
  if (name.includes('Hulu')) return 'Hulu'
  return name
}

async function fetchProviders(id: number, genre: string) {
  try {
    const mediaType = genre === '映画' ? 'movie' : 'tv'
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/watch/providers?api_key=${API_KEY}`)
    const data = await res.json()
    const flatrate = data.results?.JP?.flatrate || []
    return {
      services: flatrate.map((p: any) => normalizeServiceName(p.provider_name)),
      serviceLogos: flatrate.map((p: any) => ({
        name: normalizeServiceName(p.provider_name),
        logoUrl: 'https://image.tmdb.org/t/p/original' + p.logo_path,
      })),
    }
  } catch {
    return { services: [], serviceLogos: [] }
  }
}

function toMovie(item: any): Movie {
  return {
    id: item.id,
    title: item.title || item.name || '不明',
    year: (item.release_date || item.first_air_date || '').slice(0, 4),
    genre: item.media_type === 'movie' ? '映画' : 'ドラマ・アニメ',
    imageUrl: item.poster_path
      ? 'https://image.tmdb.org/t/p/w500' + item.poster_path
      : 'https://picsum.photos/500/750',
    backdropUrl: item.backdrop_path
      ? 'https://image.tmdb.org/t/p/w1280' + item.backdrop_path
      : '',
    overview: item.overview || '',
    services: [],
    serviceLogos: [],
  }
}

async function fetchAndEnrich(url: string): Promise<Movie[]> {
  const res = await fetch(url)
  const data = await res.json()
  const base: Movie[] = (data.results || []).map(toMovie)
  const enriched = await Promise.all(
    base.map(async (m) => {
      const { services, serviceLogos } = await fetchProviders(m.id, m.genre)
      return { ...m, services, serviceLogos }
    })
  )
  return enriched
}

// 横スクロール行コンポーネント
function MovieRow({
  title,
  movies,
  favorites,
  onToggleFavorite,
  onClickMovie,
}: {
  title: string
  movies: Movie[]
  favorites: number[]
  onToggleFavorite: (id: number) => void
  onClickMovie: (id: number) => void
}) {
  if (movies.length === 0) return null
  return (
    <div className="mb-8">
      <h2 className="text-lg font-black mb-3 px-6 text-yellow-300">{title}</h2>
      <div className="flex gap-3 overflow-x-auto px-6 pb-3 scrollbar-hide">
        {movies.map((m) => (
          <MovieCard
            key={m.id}
            {...m}
            isFavorite={favorites.includes(m.id)}
            onToggleFavorite={onToggleFavorite}
            onClick={onClickMovie}
          />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [page, setPage] = useState<Page>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])
  const [hero, setHero] = useState<Movie | null>(null)

  const [trendMovies, setTrendMovies] = useState<Movie[]>([])
  const [animeMovies, setAnimeMovies] = useState<Movie[]>([])
  const [actionMovies, setActionMovies] = useState<Movie[]>([])
  const [searchResults, setSearchResults] = useState<Movie[]>([])

  const [trendLoading, setTrendLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    // トレンド
    fetchAndEnrich(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=ja-JP`)
      .then((movies) => {
        setTrendMovies(movies)
        setHero(movies[0] || null)
        setTrendLoading(false)
      })
      .catch(() => setTrendLoading(false))

    // アニメ
    fetchAndEnrich(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=ja-JP&with_genres=16&sort_by=popularity.desc`)
      .then(setAnimeMovies)
      .catch(() => {})

    // アクション
    fetchAndEnrich(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=ja-JP&with_genres=28&sort_by=popularity.desc`)
      .then(setActionMovies)
      .catch(() => {})
  }, [])

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearched(true)
    setSearchOpen(false)
    fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=ja-JP&query=${encodeURIComponent(searchQuery)}`)
      .then((r) => r.json())
      .then(async (data) => {
        const base = (data.results || []).filter((i: any) => i.poster_path).map(toMovie)
        setSearchResults(base)
        setSearchLoading(false)
        const enriched = await Promise.all(
          base.map(async (m: Movie) => {
            const { services, serviceLogos } = await fetchProviders(m.id, m.genre)
            return { ...m, services, serviceLogos }
          })
        )
        setSearchResults(enriched)
      })
      .catch(() => setSearchLoading(false))
  }

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id])
  }

  const handleClickMovie = (id: number) => {
    // Day3で詳細ページを実装予定
    console.log('作品クリック:', id)
  }

  const navItems: { label: string; key: Page }[] = [
    { label: 'HOME', key: 'home' },
    { label: 'SERIES', key: 'series' },
    { label: 'MOVIES', key: 'movies' },
    { label: 'MY LIST', key: 'mylist' },
    { label: 'TRENDING', key: 'trending' },
  ]

  const seriesMovies = trendMovies.filter((m) => m.genre !== '映画')
  const onlyMovies = trendMovies.filter((m) => m.genre === '映画')
  const favoriteMovies = trendMovies.filter((m) => favorites.includes(m.id))

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-yellow-300/10">
        <div className="flex items-center justify-between px-6 h-16">
          <button onClick={() => setPage('home')} className="flex items-center gap-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="8" width="32" height="22" rx="3" fill="#1a1a1a" stroke="#FFE600" strokeWidth="2"/>
              <line x1="14" y1="30" x2="10" y2="37" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
              <line x1="26" y1="30" x2="30" y2="37" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="37" x2="32" y2="37" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
              <text x="20" y="23" textAnchor="middle" fontSize="12" fill="#FFE600" fontWeight="bold">∞</text>
            </svg>
            <span className="text-yellow-300 font-black text-xl tracking-widest">LOOPBOX</span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button key={item.key} onClick={() => setPage(item.key)}
                className={`text-sm font-bold tracking-wider transition-colors
                  ${page === item.key ? 'text-yellow-300' : 'text-gray-400 hover:text-white'}`}>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {searchOpen ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-300 w-48"
                />
                <button onClick={handleSearch} className="text-yellow-300 text-sm font-bold">検索</button>
                <button onClick={() => setSearchOpen(false)} className="text-gray-400">✕</button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-gray-300 hover:text-yellow-300 transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* スマホ用ナビ */}
        <div className="flex md:hidden items-center gap-4 px-4 pb-2 overflow-x-auto">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => setPage(item.key)}
              className={`flex-shrink-0 text-xs font-bold tracking-wider pb-1 border-b-2 transition-colors
                ${page === item.key ? 'text-yellow-300 border-yellow-300' : 'text-gray-500 border-transparent'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="pt-20">

        {/* HOME */}
        {page === 'home' && (
          <div>
            {/* ヒービュー */}
            {hero && (
              <div className="relative w-full h-[75vh] overflow-hidden">
                {hero.backdropUrl
                  ? <img src={hero.backdropUrl} alt={hero.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gray-800" />}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
                <div className="absolute bottom-16 left-8 max-w-lg">
                  <h1 className="text-5xl font-black mb-3 leading-tight drop-shadow-lg">{hero.title}</h1>
                  <p className="text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed">{hero.overview}</p>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-yellow-300 text-gray-950 font-black px-8 py-3 rounded-lg hover:bg-yellow-200 transition-colors text-sm">
                      ▶ 再生
                    </button>
                    <button className="flex items-center gap-2 bg-gray-700/80 text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                      詳細情報
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 横スクロール列 */}
            <div className="py-6">
              {trendLoading ? <LoadingRow /> : (
                <MovieRow title="🔥 今週のトレンド" movies={trendMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
              )}
              <MovieRow title="🎌 人気のアニメ" movies={animeMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
              <MovieRow title="💥 アクション・アドベンチャー" movies={actionMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
            </div>
          </div>
        )}

        {/* SERIES */}
        {page === 'series' && (
          <div className="py-6">
            <MovieRow title="📺 シリーズ・アニメ" movies={seriesMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
            <MovieRow title="🎌 人気のアニメ" movies={animeMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
          </div>
        )}

        {/* MOVIES */}
        {page === 'movies' && (
          <div className="py-6">
            <MovieRow title="🎬 映画" movies={onlyMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
            <MovieRow title="💥 アクション" movies={actionMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
          </div>
        )}

        {/* MY LIST */}
        {page === 'mylist' && (
          <div className="py-6">
            {favoriteMovies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">🤍</div>
                <p className="text-gray-400">まだリストがありません</p>
                <p className="text-gray-600 text-sm mt-1">カードのハートを押して追加しよう！</p>
              </div>
            ) : (
              <MovieRow title="❤️ マイリスト" movies={favoriteMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
            )}
          </div>
        )}

        {/* TRENDING */}
        {page === 'trending' && (
          <div className="py-6">
            <MovieRow title="📈 今週のトレンド" movies={trendMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={handleClickMovie} />
          </div>
        )}

        {/* 検索結果 */}
        {searched && (
          <div className={`py-6 ${page !== 'home' && page !== 'series' && page !== 'movies' && page !== 'mylist' && page !== 'trending' ? '' : 'hidden'}`}>
          </div>
        )}

      </main>

      {/* 検索結果オーバーレイ */}
      {searched && (
        <div className="fixed inset-0 z-40 bg-gray-950/95 overflow-y-auto pt-24 px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-yellow-300">🔍 「{searchQuery}」の検索結果</h2>
            <button onClick={() => setSearched(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>
          {searchLoading ? <LoadingRow /> : (
            <>
              <p className="text-gray-500 text-xs mb-4">{searchResults.length}件見つかりました</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {searchResults.map((m) => (
                  <MovieCard key={m.id} {...m} isFavorite={favorites.includes(m.id)} onToggleFavorite={toggleFavorite} onClick={handleClickMovie} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  )
}

function LoadingRow() {
  return (
    <div className="mb-8">
      <div className="h-6 w-40 bg-gray-800 rounded mb-3 mx-6 animate-pulse" />
      <div className="flex gap-3 px-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-36 rounded-xl overflow-hidden bg-gray-900 animate-pulse">
            <div className="aspect-[2/3] bg-gray-800" />
            <div className="p-2">
              <div className="h-3 bg-gray-800 rounded mb-1" />
              <div className="h-2 bg-gray-800 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}