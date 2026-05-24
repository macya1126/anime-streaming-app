'use client'

import { useState, useEffect, useRef } from 'react'
import MovieCard from './MovieCard'
import AdBanner from './AdBanner'

type Page = 'home' | 'series' | 'movies' | 'mylist' | 'trending' | 'genre'
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
const SERVICE_URLS: Record<string, string> = {
  'Netflix': 'https://www.netflix.com',
  'Prime': 'https://www.amazon.co.jp/prime-video',
  'Disney+': 'https://www.disneyplus.com/ja-jp',
  'Hulu': 'https://www.hulu.jp',
}

const GENRE_TAGS = [
  { label: '異世界', id: 10765 },
  { label: '日常', id: 16 },
  { label: 'ラブコメ', id: 10749 },
  { label: 'アクション', id: 28 },
  { label: 'ファンタジー', id: 14 },
  { label: 'ホラー', id: 27 },
  { label: 'SF', id: 878 },
]

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
  } catch { return { services: [], serviceLogos: [] } }
}

function toMovie(item: any): Movie {
  return {
    id: item.id,
    title: item.title || item.name || '不明',
    year: (item.release_date || item.first_air_date || '').slice(0, 4),
    genre: item.media_type === 'movie' ? '映画' : 'ドラマ・アニメ',
    imageUrl: item.poster_path ? 'https://image.tmdb.org/t/p/w500' + item.poster_path : 'https://picsum.photos/500/750',
    backdropUrl: item.backdrop_path ? 'https://image.tmdb.org/t/p/w1280' + item.backdrop_path : '',
    overview: item.overview || '',
    services: [],
    serviceLogos: [],
  }
}

async function fetchAndEnrich(url: string): Promise<Movie[]> {
  const res = await fetch(url)
  const data = await res.json()
  const base: Movie[] = (data.results || []).map(toMovie)
  return Promise.all(base.map(async (m) => {
    const { services, serviceLogos } = await fetchProviders(m.id, m.genre)
    return { ...m, services, serviceLogos }
  }))
}

function LogoIcon() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
      <circle cx="10" cy="16" r="9" fill="none" stroke="#FFE600" strokeWidth="2.5"/>
      <circle cx="34" cy="16" r="9" fill="none" stroke="#FFE600" strokeWidth="2.5"/>
      <rect x="15" y="10" width="14" height="12" rx="2" fill="#111" stroke="#FFE600" strokeWidth="2"/>
      <line x1="19" y1="10" x2="15" y2="4" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
      <line x1="25" y1="10" x2="29" y2="4" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="22" x2="18" y2="26" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="22" x2="26" y2="26" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
      <line x1="17" y1="26" x2="27" y2="26" stroke="#FFE600" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// 横スクロール or グリッド切り替え列（もっと見るボタン付き）
function MovieRow({ title, movies, favorites, onToggleFavorite, onClickMovie, onViewMore }: {
  title: string
  movies: Movie[]
  favorites: number[]
  onToggleFavorite: (id: number) => void
  onClickMovie: (movie: Movie) => void
  onViewMore?: () => void
}) {
  const [showAll, setShowAll] = useState(false)
  if (movies.length === 0) return null
  const displayMovies = showAll ? movies : movies.slice(0, 12)

  return (
    <div className="mb-10">
      {title && (
        <div className="flex items-center justify-between px-4 sm:px-6 mb-3">
          <h2 className="text-base sm:text-lg font-black text-yellow-300">{title}</h2>
          {onViewMore && (
            <button onClick={onViewMore} className="text-xs text-gray-400 hover:text-yellow-300 transition-colors font-bold">
              もっと見る →
            </button>
          )}
        </div>
      )}

      {/* スマホ：グリッド表示 */}
      <div className="sm:hidden px-4">
        <div className="grid grid-cols-3 gap-2">
          {displayMovies.map((m) => (
            <div key={m.id} className="relative rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group" onClick={() => onClickMovie(m)}>
              <div className="relative aspect-[2/3] overflow-hidden">
                <img src={m.imageUrl} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(m.id) }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                  <span className="text-[10px]">{favorites.includes(m.id) ? '❤️' : '🤍'}</span>
                </button>
              </div>
              <div className="p-1.5">
                <p className="text-white text-[10px] font-bold leading-tight line-clamp-1">{m.title}</p>
                <p className="text-gray-500 text-[9px]">{m.year}</p>
              </div>
            </div>
          ))}
        </div>
        {/* スマホ：もっと見るボタン */}
        {movies.length > 12 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-3 py-2.5 border border-yellow-300/30 rounded-xl text-yellow-300 text-xs font-bold hover:bg-yellow-300/10 transition-colors"
          >
            {showAll ? '閉じる ↑' : `もっと見る（残り${movies.length - 12}件）↓`}
          </button>
        )}
      </div>

      {/* PC：横スクロール */}
      <div className="hidden sm:flex gap-3 overflow-x-auto px-6 pb-3 scrollbar-hide">
        {movies.map((m) => (
          <MovieCard key={m.id} {...m} isFavorite={favorites.includes(m.id)} onToggleFavorite={onToggleFavorite} onClick={() => onClickMovie(m)} />
        ))}
        {/* PC：もっと見るボタン */}
        {onViewMore && (
          <div className="flex-shrink-0 w-32 flex items-center justify-center">
            <button onClick={onViewMore}
              className="flex flex-col items-center gap-2 text-yellow-300 hover:text-yellow-200 transition-colors">
              <div className="w-12 h-12 rounded-full border-2 border-yellow-300 flex items-center justify-center text-xl">→</div>
              <span className="text-xs font-bold">もっと見る</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 詳細モーダル
function MovieModal({ movie, isFavorite, onToggleFavorite, onClose }: {
  movie: Movie
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
  onClose: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-yellow-300/20">✕</button>
        <div className="relative w-full aspect-video">
          {movie.backdropUrl
            ? <img src={movie.backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
            : <img src={movie.imageUrl} alt={movie.title} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl sm:text-2xl font-black leading-tight">{movie.title}</h2>
            <button onClick={() => onToggleFavorite(movie.id)}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-yellow-300/20">
              <span className="text-xl">{isFavorite ? '❤️' : '🤍'}</span>
            </button>
          </div>
          <p className="text-gray-400 text-xs mb-1">{movie.year} · {movie.genre}</p>
          {movie.overview && <p className="text-gray-300 text-sm leading-relaxed mb-5">{movie.overview}</p>}
          {movie.serviceLogos.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-500 text-xs mb-3 font-bold">▶ 配信中のサービス</p>
              <div className="flex flex-wrap gap-3">
                {movie.serviceLogos.map((s) => (
                  <a key={s.name + "-" + s.logoUrl} href={SERVICE_URLS[s.name] || '#'} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-800 hover:bg-yellow-300/10 border border-gray-700 hover:border-yellow-300/50 rounded-xl px-4 py-2.5 transition-all group">
                    <img src={s.logoUrl} alt={s.name} className="w-6 h-6 rounded object-cover" />
                    <span className="text-white text-sm font-bold group-hover:text-yellow-300">{s.name}</span>
                    <span className="text-gray-500 text-xs group-hover:text-yellow-300">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          {movie.serviceLogos.length === 0 && (
            <div className="bg-gray-800 rounded-xl p-4 text-center mb-4">
              <p className="text-gray-500 text-sm">日本での配信情報なし</p>
            </div>
          )}
          <AdBanner variant="modal" />
        </div>
      </div>
    </div>
  )
}

// ポリシーモーダル
function PolicyModal({ type, onClose }: { type: 'privacy' | 'terms', onClose: () => void }) {
  const content = type === 'privacy' ? {
    title: 'プライバシーポリシー',
    body: `LOOPBOXは、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。\n\n本サービスでは、映画・アニメ情報の提供にTMDB APIを使用しています。ユーザーの検索履歴や閲覧データは、サービス改善のために使用する場合があります。\n\n広告配信のため、Google AdSenseを使用する場合があります。これによりCookieが使用されることがあります。\n\nお問い合わせ：loopbox@example.com`
  } : {
    title: '利用規約',
    body: `LOOPBOXをご利用いただきありがとうございます。\n\n本サービスは、映画・アニメの配信情報を横断検索するための情報提供サービスです。\n\n・本サービスは個人利用を目的としています。\n・コンテンツの無断転載・複製を禁止します。\n・サービス内容は予告なく変更される場合があります。\n・本サービスの利用によって生じた損害について、運営者は責任を負いません。\n\n© 2026 LOOPBOX. All rights reserved.`
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-yellow-300">{content.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{content.body}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const [page, setPage] = useState<Page>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [policyModal, setPolicyModal] = useState<'privacy' | 'terms' | null>(null)

  const [trendMovies, setTrendMovies] = useState<Movie[]>([])
  const [animeMovies, setAnimeMovies] = useState<Movie[]>([])
  const [actionMovies, setActionMovies] = useState<Movie[]>([])
  const [genreMovies, setGenreMovies] = useState<Movie[]>([])
  const [genreTitle, setGenreTitle] = useState('')
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [suggestions, setSuggestions] = useState<Movie[]>([])
  const [trendLoading, setTrendLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [heroIndex, setHeroIndex] = useState(0)
  const [heroVisible, setHeroVisible] = useState(true)
  const heroRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const heroMovies = trendMovies.slice(0, 5)
  const hero = heroMovies[heroIndex] || null

  useEffect(() => {
    if (heroMovies.length === 0) return
    heroRef.current = setTimeout(() => {
      setHeroVisible(false)
      setTimeout(() => { setHeroIndex((prev) => (prev + 1) % heroMovies.length); setHeroVisible(true) }, 600)
    }, 5000)
    return () => { if (heroRef.current) clearTimeout(heroRef.current) }
  }, [heroIndex, heroMovies.length])

  useEffect(() => {
    fetchAndEnrich(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=ja-JP`)
      .then((m) => { setTrendMovies(m); setTrendLoading(false) }).catch(() => setTrendLoading(false))
    fetchAndEnrich(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=ja-JP&with_genres=16&sort_by=popularity.desc`)
      .then(setAnimeMovies).catch(() => {})
    fetchAndEnrich(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=ja-JP&with_genres=28&sort_by=popularity.desc`)
      .then(setActionMovies).catch(() => {})
  }, [])

  // インクリメンタルサーチ
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    const timer = setTimeout(() => {
      fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=ja-JP&query=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((data) => {
          const results = (data.results || []).filter((i: any) => i.poster_path).slice(0, 8).map(toMovie)
          setSuggestions(results)
          setShowSuggestions(true)
        }).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // サジェスト外クリックで閉じる
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true); setSearched(true); setSearchOpen(false); setShowSuggestions(false)
    fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=ja-JP&query=${encodeURIComponent(searchQuery)}`)
      .then((r) => r.json())
      .then(async (data) => {
        const base = (data.results || []).filter((i: any) => i.poster_path).map(toMovie)
        setSearchResults(base); setSearchLoading(false)
        const enriched = await Promise.all(base.map(async (m: Movie) => {
          const { services, serviceLogos } = await fetchProviders(m.id, m.genre)
          return { ...m, services, serviceLogos }
        }))
        setSearchResults(enriched)
      }).catch(() => setSearchLoading(false))
  }

  // ジャンルタグ検索
  const handleGenreTag = (tag: { label: string; id: number }) => {
    setGenreTitle(tag.label)
    setPage('genre')
    setSearched(false)
    fetchAndEnrich(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=ja-JP&with_genres=${tag.id}&sort_by=popularity.desc`)
      .then(setGenreMovies).catch(() => {})
  }

  // もっと見る
  const handleViewMore = (title: string, movies: Movie[]) => {
    setGenreTitle(title)
    setGenreMovies(movies)
    setPage('genre')
  }

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id])
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-yellow-300/10">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
          <button onClick={() => { setPage('home'); setSearched(false) }} className="flex items-center gap-2">
            <LogoIcon />
            <span className="text-yellow-300 font-black text-lg sm:text-xl tracking-widest">LOOPBOX</span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button key={item.key} onClick={() => { setPage(item.key); setSearched(false) }}
                className={`text-sm font-bold tracking-wider transition-colors ${page === item.key ? 'text-yellow-300' : 'text-gray-400 hover:text-white'}`}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2" ref={searchRef}>
            {searchOpen ? (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <input autoFocus type="text" placeholder="検索..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-300 w-48 sm:w-64" />
                  <button onClick={handleSearch} className="text-yellow-300 text-sm font-bold">検索</button>
                  <button onClick={() => { setSearchOpen(false); setShowSuggestions(false) }} className="text-gray-400 text-lg">✕</button>
                </div>
                {/* サジェストドロップダウン */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-10 left-0 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {suggestions.map((m) => (
                      <button key={m.id} onClick={() => { setSelectedMovie(m); setShowSuggestions(false); setSearchOpen(false) }}
                        className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-800 transition-colors text-left">
                        <img src={m.imageUrl} alt={m.title} className="w-8 h-12 object-cover rounded" />
                        <div>
                          <p className="text-white text-xs font-bold line-clamp-1">{m.title}</p>
                          <p className="text-gray-500 text-[10px]">{m.year} · {m.genre}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-gray-300 hover:text-yellow-300 p-2">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex md:hidden items-center gap-4 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => { setPage(item.key); setSearched(false) }}
              className={`flex-shrink-0 text-xs font-bold tracking-wider pb-1 border-b-2 transition-colors ${page === item.key ? 'text-yellow-300 border-yellow-300' : 'text-gray-500 border-transparent'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="pt-16 sm:pt-20 flex-1">

        {/* ジャンルタグバー（常に表示） */}
        {!searched && page !== 'genre' && (
          <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 py-3 scrollbar-hide border-b border-gray-800/50">
            {GENRE_TAGS.map((tag) => (
              <button key={tag.id} onClick={() => handleGenreTag(tag)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full border border-yellow-300/40 text-yellow-300 text-xs font-bold hover:bg-yellow-300/10 transition-colors">
                {tag.label}
              </button>
            ))}
          </div>
        )}

        {/* HOME */}
        {page === 'home' && !searched && (
          <div>
            {hero && (
              <div className="relative w-full h-[55vh] sm:h-[70vh] overflow-hidden">
                <div className={`absolute inset-0 transition-opacity duration-700 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}>
                  {hero.backdropUrl
                    ? <img src={hero.backdropUrl} alt={hero.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-800" />}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
                <div className={`absolute bottom-8 sm:bottom-16 left-4 sm:left-8 max-w-xs sm:max-w-lg transition-opacity duration-700 ${heroVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <h1 className="text-2xl sm:text-4xl font-black mb-2 leading-tight">{hero.title}</h1>
                  <p className="text-gray-300 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">{hero.overview}</p>
                  {/* Playボタンのみ → モーダルを開く */}
                  <button
                    onClick={() => setSelectedMovie(hero)}
                    className="flex items-center gap-2 bg-yellow-300 text-gray-950 font-black px-6 sm:px-10 py-2.5 sm:py-3 rounded-lg hover:bg-yellow-200 transition-colors text-sm sm:text-base"
                  >
                    ▶ Play
                  </button>
                </div>
                <div className="absolute bottom-3 right-4 flex gap-1.5">
                  {heroMovies.map((_, i) => (
                    <button key={i}
                      onClick={() => { setHeroVisible(false); setTimeout(() => { setHeroIndex(i); setHeroVisible(true) }, 300) }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'bg-yellow-300 w-4' : 'bg-gray-500 w-1.5'}`} />
                  ))}
                </div>
              </div>
            )}
            <div className="py-4 sm:py-6">
              {trendLoading ? <LoadingRow /> : (
                <MovieRow title="🔥 今週のトレンド" movies={trendMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie}
                  onViewMore={() => handleViewMore('🔥 今週のトレンド', trendMovies)} />
              )}
              <div className="px-4 sm:px-6"><AdBanner variant="horizontal" /></div>
              <MovieRow title="🎌 人気のアニメ" movies={animeMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie}
                onViewMore={() => handleViewMore('🎌 人気のアニメ', animeMovies)} />
              <MovieRow title="💥 アクション・アドベンチャー" movies={actionMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie}
                onViewMore={() => handleViewMore('💥 アクション・アドベンチャー', actionMovies)} />
            </div>
          </div>
        )}

        {page === 'series' && !searched && (
          <div className="py-4 sm:py-6">
            <MovieRow title="📺 シリーズ・アニメ" movies={seriesMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie}
              onViewMore={() => handleViewMore('📺 シリーズ・アニメ', seriesMovies)} />
            <MovieRow title="🎌 人気のアニメ" movies={animeMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie}
              onViewMore={() => handleViewMore('🎌 人気のアニメ', animeMovies)} />
          </div>
        )}

        {page === 'movies' && !searched && (
          <div className="py-4 sm:py-6">
            <MovieRow title="🎬 映画" movies={onlyMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie}
              onViewMore={() => handleViewMore('🎬 映画', onlyMovies)} />
            <MovieRow title="💥 アクション" movies={actionMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie}
              onViewMore={() => handleViewMore('💥 アクション', actionMovies)} />
          </div>
        )}

        {page === 'mylist' && !searched && (
          <div className="py-4 sm:py-6 px-4 sm:px-6">
            <h2 className="text-base sm:text-lg font-black mb-4 text-yellow-300">❤️ マイリスト</h2>
            {favoriteMovies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-5xl mb-4">🤍</div>
                <p className="text-gray-400 text-sm">まだリストがありません</p>
                <p className="text-gray-600 text-xs mt-1">カードのハートを押して追加しよう！</p>
              </div>
            ) : (
              <MovieRow title="" movies={favoriteMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
            )}
          </div>
        )}

        {page === 'trending' && !searched && (
          <div className="py-4 sm:py-6">
            <MovieRow title="📈 今週のトレンド" movies={trendMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie}
              onViewMore={() => handleViewMore('📈 今週のトレンド', trendMovies)} />
          </div>
        )}

        {/* ジャンル一覧ページ */}
        {page === 'genre' && (
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setPage('home')} className="text-gray-400 hover:text-white text-xl">←</button>
              <h2 className="text-xl font-black text-yellow-300">{genreTitle}</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              {genreMovies.map((m) => (
                <div key={m.id} className="relative rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group" onClick={() => setSelectedMovie(m)}>
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img src={m.imageUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(m.id) }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                      <span className="text-[10px]">{favorites.includes(m.id) ? '❤️' : '🤍'}</span>
                    </button>
                  </div>
                  <div className="p-1.5">
                    <p className="text-white text-[10px] font-bold line-clamp-1">{m.title}</p>
                    <p className="text-gray-500 text-[9px]">{m.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 検索結果 */}
        {searched && (
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-xl font-black text-yellow-300">🔍 「{searchQuery}」</h2>
              <button onClick={() => setSearched(false)} className="text-gray-400 hover:text-white text-xl p-2">✕</button>
            </div>
            {searchLoading ? <LoadingRow /> : (
              <>
                <p className="text-gray-500 text-xs mb-4">{searchResults.length}件見つかりました</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                  {searchResults.map((m) => (
                    <div key={m.id} className="relative rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group" onClick={() => setSelectedMovie(m)}>
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img src={m.imageUrl} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(m.id) }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                          <span className="text-[10px]">{favorites.includes(m.id) ? '❤️' : '🤍'}</span>
                        </button>
                      </div>
                      <div className="p-1.5">
                        <p className="text-white text-[10px] font-bold line-clamp-1">{m.title}</p>
                        <p className="text-gray-500 text-[9px]">{m.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* フッター */}
      <footer className="border-t border-gray-800 py-6 px-4 sm:px-6 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LogoIcon />
            <span className="text-yellow-300 font-black text-sm tracking-widest">LOOPBOX</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <button onClick={() => setPolicyModal('privacy')} className="hover:text-yellow-300 transition-colors">Privacy Policy</button>
            <span>·</span>
            <button onClick={() => setPolicyModal('terms')} className="hover:text-yellow-300 transition-colors">Terms of Service</button>
          </div>
          <p className="text-gray-600 text-xs">© 2026 LOOPBOX. All rights reserved.</p>
        </div>
      </footer>

      {selectedMovie && (
        <MovieModal movie={selectedMovie} isFavorite={favorites.includes(selectedMovie.id)} onToggleFavorite={toggleFavorite} onClose={() => setSelectedMovie(null)} />
      )}
      {policyModal && (
        <PolicyModal type={policyModal} onClose={() => setPolicyModal(null)} />
      )}

    </div>
  )
}

function LoadingRow() {
  return (
    <div className="mb-10">
      <div className="h-5 w-36 bg-gray-800 rounded mb-3 mx-4 sm:mx-6 animate-pulse" />
      <div className="hidden sm:flex gap-3 px-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-40 rounded-2xl overflow-hidden bg-gray-900 animate-pulse">
            <div className="aspect-[2/3] bg-gray-800" />
            <div className="p-2"><div className="h-3 bg-gray-800 rounded mb-1" /><div className="h-2 bg-gray-800 rounded w-2/3" /></div>
          </div>
        ))}
      </div>
      <div className="sm:hidden grid grid-cols-3 gap-2 px-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-gray-900 animate-pulse">
            <div className="aspect-[2/3] bg-gray-800" />
            <div className="p-1.5"><div className="h-2 bg-gray-800 rounded mb-1" /></div>
          </div>
        ))}
      </div>
    </div>
  )
}