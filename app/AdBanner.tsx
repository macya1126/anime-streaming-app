type Props = {
  variant?: 'horizontal' | 'modal'
}

export default function AdBanner({ variant = 'horizontal' }: Props) {
  return (
    <div className={`w-full flex items-center justify-center border border-yellow-300/30 rounded-xl bg-gray-950 relative overflow-hidden ${variant === 'modal' ? 'h-16 my-2' : 'h-20 my-4'}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/5 via-transparent to-yellow-300/5" />
      <div className="relative flex items-center gap-3 px-4">
        <div className="w-px h-6 bg-yellow-300/40" />
        <p className="text-yellow-300/70 text-xs font-bold tracking-widest uppercase">【PR】Sponsor</p>
        <div className="w-px h-6 bg-yellow-300/40" />
      </div>
    </div>
  )
}