'use client'

import { useState, useEffect } from 'react'
import MovieCard from './MovieCard'
import AdBanner from './AdBanner'
type Tab = 'search' | 'favorites' | 'recommended'

type ServiceLogo = { name: string; logoUrl: string }

type Movie = {
  id: number
  title: string
  year: string
  genre: string
  imageUrl: string
  services: string[]
  serviceLogos: ServiceLogo[]
}

const SERVICES = ['すべて', 'Netflix', 'Prime', 'Disney+', 'Hulu']
const API_KEY = 'aaf4645e0eb5029750aea69faec3c126'

// サービス名の正規化
function normalizeServiceName(name: string): string {
  if (name.includes('Netflix')) return 'Netflix'
  if (name.includes('Amazon') || name.includes('Prime')) return 'Prime'
  if (name.includes('Disney')) return 'Disney+'
  if (name.includes('Hulu')) return 'Hulu'
  return name
}

// TMDB配信情報を取得
async function fetchProviders(id: number, type: string): Promise<{ services: string[]; serviceLogos: ServiceLogo[] }> {
  try {
    const mediaType = type === '映画' ? 'movie' : 'tv'
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${id}/watch/providers?api_key=${API_KEY}`
    )
    const data = await res.json()
    const jp = data.results?.JP
    const flatrate = jp?.flatrate || []

    const services = flatrate.map((p: any) => normalizeServiceName(p.provider_name))
    const serviceLogos = flatrate.map((p: any) => ({
      name: normalizeServiceName(p.provider_name),
      logoUrl: 'https://image.tmdb.org/t/p/original' + p.logo_path,
    }))

    return { services, serviceLogos }
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
      ? 'https://image.tmdb.org/t/p/w300' + item.poster_path
      : 'https://picsum.photos/300/450',
    services: [],
    serviceLogos: [],
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('recommended')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeService, setActiveService] = useState('すべて')
  const [favorites, setFavorites] = useState<number[]>([])
  const [trendMovies, setTrendMovies] = useState<Movie[]>([])
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [trendLoading, setTrendLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // おすすめ：トレンド取得 → 配信情報も取得
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=ja-JP`)
      .then((r) => r.json())
      .then(async (data) => {
        const base: Movie[] = (data.results || []).map(toMovie)
        setTrendMovies(base)
        setTrendLoading(false)

        // 配信情報を非同期で追加
        const withProviders = await Promise.all(
          base.map(async (m) => {
            const { services, serviceLogos } = await fetchProviders(m.id, m.genre)
            return { ...m, services, serviceLogos }
          })
        )
        setTrendMovies(withProviders)
      })
      .catch(() => setTrendLoading(false))
  }, [])

  // 検索実行
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearched(true)
    setActiveService('すべて')

    fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=ja-JP&query=${encodeURIComponent(searchQuery)}`)
      .then((r) => r.json())
      .then(async (data) => {
        const base: Movie[] = (data.results || [])
          .filter((i: any) => i.poster_path)
          .map(toMovie)
        setSearchResults(base)
        setSearchLoading(false)

        // 配信情報を非同期で追加
        const withProviders = await Promise.all(
          base.map(async (m) => {
            const { services, serviceLogos } = await fetchProviders(m.id, m.genre)
            return { ...m, services, serviceLogos }
          })
        )
        setSearchResults(withProviders)
      })
      .catch(() => setSearchLoading(false))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id])
  }

  // サービスでフィルター
  const filterByService = (movies: Movie[]) => {
    if (activeService === 'すべて') return movies
    return movies.filter((m) => m.services.includes(activeService))
  }

  const filteredSearch = filterByService(searchResults)
  const filteredTrend = filterByService(trendMovies)
  const favoriteMovies = trendMovies.filter((m) => favorites.includes(m.id))

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <main className="flex-1 overflow-y-auto">

        {/* ===== 検索画面 ===== */}
        {activeTab === 'search' && (
          <div className="px-4 pt-6 pb-4">
            <h1 className="text-2xl font-bold mb-4">
              <span className="text-yellow-300">作品</span>を探す
            </h1>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="タイトルで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>
              <button onClick={handleSearch}
                className="bg-yellow-300 text-gray-950 font-bold px-4 rounded-xl text-sm">
                検索
              </button>
            </div>

            {/* サービスチップ */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {SERVICES.map((s) => (
                <button key={s} onClick={() => setActiveService(s)}
                  className={'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ' +
                    (activeService === s ? 'bg-yellow-300 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400')}>
                  {s}
                </button>
              ))}
            </div>
            <AdBanner />
            {!searched && <p className="text-gray-500 text-sm text-center mt-10">キーワードを入力して検索してください</p>}
            {searchLoading && <LoadingGrid />}
            {searched && !searchLoading && filteredSearch.length === 0 && (
              <p className="text-gray-400 text-center mt-10">作品が見つかりませんでした</p>
            )}
            {searched && !searchLoading && filteredSearch.length > 0 && (
              <>
                <p className="text-gray-500 text-xs mb-3">{filteredSearch.length}件見つかりました</p>
                <div className="grid grid-cols-2 gap-3">
                  {filteredSearch.map((m) => (
                    <MovieCard key={m.id} {...m} isFavorite={favorites.includes(m.id)} onToggleFavorite={toggleFavorite} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== お気に入り画面 ===== */}
        {activeTab === 'favorites' && (
          <div className="px-4 pt-6 pb-4">
            <h1 className="text-2xl font-bold mb-4">
              <span className="text-yellow-300">お気に入り</span>作品
            </h1>
            {favoriteMovies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">🤍</div>
                <p className="text-gray-400">まだお気に入りがありません</p>
                <p className="text-gray-600 text-sm mt-1">カードのハートを押して追加しよう！</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {favoriteMovies.map((m) => (
                  <MovieCard key={m.id} {...m} isFavorite={true} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== おすすめ画面 ===== */}
        {activeTab === 'recommended' && (
          <div className="px-4 pt-6 pb-4">
            <h1 className="text-2xl font-bold mb-4">
              <span className="text-yellow-300">おすすめ</span>作品
            </h1>

            {/* サービスチップ */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {SERVICES.map((s) => (
                <button key={s} onClick={() => setActiveService(s)}
                  className={'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ' +
                    (activeService === s ? 'bg-yellow-300 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400')}>
                  {s}
                </button>
              ))}
            </div>

            {trendLoading ? <LoadingGrid /> : (
              <>
                {filteredTrend.length === 0 && (
                  <p className="text-gray-400 text-center mt-10">該当する作品がありません</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {filteredTrend.map((m) => (
                    <MovieCard key={m.id} {...m} isFavorite={favorites.includes(m.id)} onToggleFavorite={toggleFavorite} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* 下メニューバー */}
      <nav className="bg-gray-900 border-t border-gray-800">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          <button onClick={() => setActiveTab('search')}
            className={'flex flex-col items-center gap-1 px-6 py-2 rounded-xl ' + (activeTab === 'search' ? 'text-yellow-300' : 'text-gray-500')}>
            <span className="text-2xl">🔍</span>
            <span className="text-xs">検索</span>
          </button>
          <button onClick={() => setActiveTab('favorites')}
            className={'relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl ' + (activeTab === 'favorites' ? 'text-yellow-300' : 'text-gray-500')}>
            <span className="text-2xl">❤️</span>
            <span className="text-xs">お気に入り</span>
            {favorites.length > 0 && (
              <span className="absolute -top-1 right-3 bg-yellow-300 text-gray-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('recommended')}
            className={'flex flex-col items-center gap-1 px-6 py-2 rounded-xl ' + (activeTab === 'recommended' ? 'text-yellow-300' : 'text-gray-500')}>
            <span className="text-2xl">⭐</span>
            <span className="text-xs">おすすめ</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-gray-900 animate-pulse">
          <div className="aspect-[2/3] bg-gray-800" />
          <div className="p-2">
            <div className="h-3 bg-gray-800 rounded mb-1" />
            <div className="h-2 bg-gray-800 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}