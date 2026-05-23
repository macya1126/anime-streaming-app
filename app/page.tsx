'use client'

import { useState, useEffect, useRef } from 'react'
import MovieCard from './MovieCard'
import AdBanner from './AdBanner'

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
const SERVICE_URLS: Record<string, string> = {
  'Netflix': 'https://www.netflix.com',
  'Prime': 'https://www.amazon.co.jp/prime-video',
  'Disney+': 'https://www.disneyplus.com/ja-jp',
  'Hulu': 'https://www.hulu.jp',
}

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

// ロゴコンポーネント
function LogoIcon() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 左の円 */}
      <circle cx="10" cy="16" r="9" fill="none" stroke="#FFE600" strokeWidth="2.5"/>
      {/* 右の円 */}
      <circle cx="34" cy="16" r="9" fill="none" stroke="#FFE600" strokeWidth="2.5"/>
      {/* 中央テレビ本体 */}
      <rect x="15" y="10" width="14" height="12" rx="2" fill="#111" stroke="#FFE600" strokeWidth="2"/>
      {/* アンテナ左 */}
      <line x1="19" y1="10" x2="15" y2="4" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
      {/* アンテナ右 */}
      <line x1="25" y1="10" x2="29" y2="4" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
      {/* テレビ脚 */}
      <line x1="20" y1="22" x2="18" y2="26" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="22" x2="26" y2="26" stroke="#FFE600" strokeWidth="2" strokeLinecap="round"/>
      <line x1="17" y1="26" x2="27" y2="26" stroke="#FFE600" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// 横スクロール or グリッド切り替え列
function MovieRow({ title, movies, favorites, onToggleFavorite, onClickMovie }: {
  title: string
  movies: Movie[]
  favorites: number[]
  onToggleFavorite: (id: number) => void
  onClickMovie: (movie: Movie) => void
}) {
  if (movies.length === 0) return null
  return (
    <div className="mb-10">
      {title && <h2 className="text-base sm:text-lg font-black mb-3 px-4 sm:px-6 text-yellow-300">{title}</h2>}
      {/* スマホ：グリッド表示 / PC：横スクロール */}
      <div className="sm:hidden grid grid-cols-3 gap-2 px-4">
        {movies.map((m) => (
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
      {/* PC：横スクロール */}
      <div className="hidden sm:flex gap-3 overflow-x-auto px-6 pb-3 scrollbar-hide">
        {movies.map((m) => (
          <MovieCard key={m.id} {...m} isFavorite={favorites.includes(m.id)} onToggleFavorite={onToggleFavorite} onClick={() => onClickMovie(m)} />
        ))}
      </div>
    </div>
  )
}

// モーダル
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

  const firstService = movie.serviceLogos[0]

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
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [trendLoading, setTrendLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [heroIndex, setHeroIndex] = useState(0)
  const [heroVisible, setHeroVisible] = useState(true)
  const heroRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true); setSearched(true); setSearchOpen(false)
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
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="flex items-center gap-2">
                <input autoFocus type="text" placeholder="検索..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-yellow-300 w-36 sm:w-48" />
                <button onClick={handleSearch} className="text-yellow-300 text-sm font-bold">検索</button>
                <button onClick={() => setSearchOpen(false)} className="text-gray-400 text-lg">✕</button>
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

        {page === 'home' && !searched && (
          <div>
            {/* ヒービュー */}
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
                  <div className="flex gap-2 sm:gap-3">
                    {/* Playボタン → 配信サービスへ直接ジャンプ */}
                    <a 
                      href={hero.serviceLogos[0] ? SERVICE_URLS[hero.serviceLogos[0].name] || '#' : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-yellow-300 text-gray-950 font-black px-4 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-yellow-200 transition-colors text-xs sm:text-sm"
                    >
                      ▶ Play
                    </a>
                    {/* More Infoボタン → モーダルを開く */}
                    <button
                      onClick={() => setSelectedMovie(hero)}
                      className="flex items-center gap-1.5 bg-gray-700/80 text-white font-bold px-4 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                    >
                      More Info
                    </button>
                  </div>
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
                <MovieRow title="🔥 今週のトレンド" movies={trendMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
              )}
              <div className="px-4 sm:px-6"><AdBanner variant="horizontal" /></div>
              <MovieRow title="🎌 人気のアニメ" movies={animeMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
              <MovieRow title="💥 アクション・アドベンチャー" movies={actionMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
            </div>
          </div>
        )}

        {page === 'series' && !searched && (
          <div className="py-4 sm:py-6">
            <MovieRow title="📺 シリーズ・アニメ" movies={seriesMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
            <MovieRow title="🎌 人気のアニメ" movies={animeMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
          </div>
        )}

        {page === 'movies' && !searched && (
          <div className="py-4 sm:py-6">
            <MovieRow title="🎬 映画" movies={onlyMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
            <MovieRow title="💥 アクション" movies={actionMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
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
            <MovieRow title="📈 今週のトレンド" movies={trendMovies} favorites={favorites} onToggleFavorite={toggleFavorite} onClickMovie={setSelectedMovie} />
          </div>
        )}

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
            <button onClick={() => setPolicyModal('privacy')} className="hover:text-yellow-300 transition-colors">
              Privacy Policy
            </button>
            <span>·</span>
            <button onClick={() => setPolicyModal('terms')} className="hover:text-yellow-300 transition-colors">
              Terms of Service
            </button>
          </div>
          <p className="text-gray-600 text-xs">© 2026 LOOPBOX. All rights reserved.</p>
        </div>
      </footer>

      {/* モーダル類 */}
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