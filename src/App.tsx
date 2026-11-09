import { useState } from 'react'
import ClosetPage from './pages/ClosetPage'
import ProfilePage from './pages/ProfilePage'
import OutfitBuilderPage from './pages/OutfitBuilderPage'

type Tab = 'closet' | 'me' | 'outfit'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'closet', label: 'Closet', icon: '\u{1F455}' },
  { id: 'me', label: 'Me', icon: '\u{1F9CD}' },
  { id: 'outfit', label: 'Outfit', icon: '\u{2728}' },
]

function App() {
  const [tab, setTab] = useState<Tab>('closet')

  return (
    <div className="h-full flex flex-col bg-blush text-ink">
      <header className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">Outfit Builder</h1>
        <p className="text-xs text-ink/60">Everything stays on this device</p>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'closet' && <ClosetPage />}
        {tab === 'me' && <ProfilePage />}
        {tab === 'outfit' && <OutfitBuilderPage />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-ink/10 flex pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id ? 'text-rose' : 'text-ink/50'
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
