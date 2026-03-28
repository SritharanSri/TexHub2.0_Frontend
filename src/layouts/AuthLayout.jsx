import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-dark">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-800 to-dark" />
          {/* Decorative circles */}
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-purple-800/25 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-purple-600/30" />
          {/* Fabric texture lines */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"
              style={{ top: `${8 * i + 4}%`, left: 0, right: 0 }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">T</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">
              TEX<span className="text-purple-400">HUB</span>
            </span>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-600/30 text-purple-300 px-4 py-2 rounded-full text-sm font-medium">
              🪡 Tailor Management Platform
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Welcome to<br />
              <span className="text-purple-400">TexHub</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
              Manage orders, bids, measurements, and customers — all in one place.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { label: 'Active Tailors', value: '150+' },
                { label: 'Orders Done', value: '4.2K' },
                { label: 'Happy Customers', value: '3.8K' },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-sm">© 2026 TexHub. All rights reserved.</p>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <span className="text-white font-black">T</span>
            </div>
            <span className="text-gray-900 font-bold text-xl">
              TEX<span className="text-purple-600">HUB</span>
            </span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
