import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import {
  copyPublicListToMine,
  createBucketList,
  getBucketLists,
  getListCoverImage,
  getPublicBucketLists,
  type BucketList,
  type PublicBucketList,
} from '../lib/bucketLists'
import {
  getCompletedStories,
  getDisplayLikeCount,
  type CompletedStory,
} from '../lib/completedStories'

type TabId = 'mine' | 'discover'
type DiscoverTabId = 'active' | 'completed'

export default function BucketListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<TabId>(() =>
    searchParams.get('tab') === 'discover' ? 'discover' : 'mine',
  )
  const [discoverTab, setDiscoverTab] = useState<DiscoverTabId>(() =>
    searchParams.get('discover') === 'completed' ? 'completed' : 'active',
  )
  const [myLists, setMyLists] = useState<BucketList[]>(() => getBucketLists())
  const [publicLists] = useState<PublicBucketList[]>(() => getPublicBucketLists())
  const [completedStories, setCompletedStories] = useState<CompletedStory[]>(() =>
    getCompletedStories(),
  )
  const [toast, setToast] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newListName, setNewListName] = useState('')

  const refreshLists = useCallback(() => {
    setMyLists(getBucketLists())
    setCompletedStories(getCompletedStories())
  }, [])

  useEffect(() => {
    refreshLists()
  }, [refreshLists])

  useEffect(() => {
    const nextTab = searchParams.get('tab') === 'discover' ? 'discover' : 'mine'
    const nextDiscover =
      searchParams.get('discover') === 'completed' ? 'completed' : 'active'
    setTab(nextTab)
    setDiscoverTab(nextDiscover)
  }, [searchParams])

  function selectTab(next: TabId) {
    setTab(next)
    if (next === 'discover') {
      setSearchParams({ tab: 'discover', discover: discoverTab })
    } else {
      setSearchParams({})
    }
  }

  function selectDiscoverTab(next: DiscoverTabId) {
    setDiscoverTab(next)
    setSearchParams({ tab: 'discover', discover: next })
  }

  function handleCreateList() {
    const name = newListName.trim()
    if (!name) return
    const list = createBucketList(name)
    setNewListName('')
    setCreating(false)
    refreshLists()
    navigate(`/bucket-list/${list.id}`)
  }

  function handleSavePublicList(list: PublicBucketList, e: React.MouseEvent) {
    e.stopPropagation()
    const copy = copyPublicListToMine(list)
    refreshLists()
    setToast(`Saved "${copy.name}" to My Lists`)
  }

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-midnight pb-28 text-white">
      <AppHeader />

      <main className="px-4 pt-2">
        <p className="text-tagline">Now you know</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Bucket List</h1>
        <p className="mt-1 text-sm text-white/48">Save experiences you want to try someday</p>

        <div className="mt-4 flex rounded-full bg-midnight-surface p-1 ring-1 ring-white/[0.08]">
          {(
            [
              { id: 'mine' as const, label: 'My Lists' },
              { id: 'discover' as const, label: 'Discover Lists' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition ${
                tab === t.id ? 'bg-gradient-tudu text-white shadow' : 'text-white/60 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'mine' ? (
          <div className="mt-4 space-y-3">
            {creating ? (
              <div className="rounded-tudu-lg bg-app-dark-elevated p-4 ring-1 ring-white/10">
                <label className="block text-xs font-semibold uppercase tracking-wide text-white/50">
                  New list name
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Summer Adventures"
                  autoFocus
                  className="mt-2 w-full rounded-tudu border border-white/10 bg-app-dark px-3 py-2.5 text-sm text-white outline-none focus:border-orange/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false)
                      setNewListName('')
                    }}
                    className="flex-1 rounded-full border border-white/10 py-2 text-sm font-semibold text-white/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateList}
                    disabled={!newListName.trim()}
                    className="flex-1 rounded-full bg-gradient-tudu py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center justify-center gap-2 rounded-tudu-lg border-2 border-dashed border-white/20 py-4 text-sm font-semibold text-orange transition hover:border-orange/50"
              >
                <span aria-hidden>＋</span>
                Create New List
              </button>
            )}

            {myLists.length === 0 && !creating ? (
              <EmptyState
                icon="📋"
                title="No lists yet"
                message="Create your first bucket list or save one from Discover Lists."
              />
            ) : (
              myLists.map((list) => (
                <ListCard
                  key={list.id}
                  title={list.name}
                  subtitle={`${list.eventIds.length} events · ${list.completedIds.length} done`}
                  image={getListCoverImage(list)}
                  onClick={() => navigate(`/bucket-list/${list.id}`)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex gap-2">
              {(
                [
                  { id: 'active' as const, label: 'Active' },
                  { id: 'completed' as const, label: 'Completed' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectDiscoverTab(t.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    discoverTab === t.id
                      ? 'bg-white/15 text-white ring-1 ring-white/20'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {discoverTab === 'active' ? (
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/bucket-lists/discover')}
                  className="flex w-full items-center justify-between rounded-[var(--radius-xl)] bg-gradient-tudu p-4 text-left glow-warm"
                >
                  <div>
                    <p className="text-tagline text-white/90">Now you know</p>
                    <p className="font-display text-base font-bold text-white">Swipe album-cover lists</p>
                    <p className="mt-1 text-xs text-white/75">Full-screen discovery feed</p>
                  </div>
                  <span className="text-2xl" aria-hidden>
                    🪣
                  </span>
                </button>
                {publicLists.map((list) => (
                  <div key={list.id} className="relative">
                    <ListCard
                      title={list.name}
                      subtitle={`by ${list.ownerName} · ${list.events.length} events`}
                      image={list.coverImage}
                      description={list.description}
                      ownerInitials={list.ownerInitials}
                      onClick={() => navigate(`/bucket-list/${list.id}`)}
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSavePublicList(list, e)}
                      className="absolute right-3 top-3 rounded-full bg-app-dark/80 px-3 py-1.5 text-xs font-semibold text-orange ring-1 ring-white/10 backdrop-blur-sm"
                    >
                      Save List
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {completedStories.length === 0 ? (
                  <EmptyState
                    icon="✨"
                    title="No completed stories yet"
                    message="Mark items complete on your lists or check back for community stories."
                  />
                ) : (
                  completedStories.map((story) => (
                    <CompletedStoryCard
                      key={story.id}
                      story={story}
                      likeCount={getDisplayLikeCount(story)}
                      onClick={() => navigate(`/bucket-list/story/${story.id}`)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} dark />}
    </div>
  )
}

function ListCard({
  title,
  subtitle,
  image,
  description,
  ownerInitials,
  onClick,
}: {
  title: string
  subtitle: string
  image?: string
  description?: string
  ownerInitials?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full overflow-hidden rounded-[var(--radius-lg)] glass-surface text-left transition duration-[var(--duration-fast)] hover:ring-magenta/30 active:scale-[0.99]"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-dusk text-2xl">📋</span>
        )}
        {ownerInitials && (
          <span className="absolute bottom-1 right-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-tudu font-display text-[10px] font-bold text-white">
              {ownerInitials}
            </span>
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 p-3 py-2.5">
        <h2 className="truncate font-display text-base font-bold">{title}</h2>
        <p className="mt-0.5 text-xs text-white/48">{subtitle}</p>
        {description && (
          <p className="mt-1 line-clamp-2 text-xs text-white/40">{description}</p>
        )}
      </div>
      <span className="self-center pr-3 text-white/30">›</span>
    </button>
  )
}

function CompletedStoryCard({
  story,
  likeCount,
  onClick,
}: {
  story: CompletedStory
  likeCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 rounded-tudu-lg bg-app-dark-elevated p-3 text-left ring-1 ring-white/10 transition hover:ring-orange/30"
    >
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-tudu bg-white/5">
        <img src={story.coverImage} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-lg">
          ▶
        </span>
        <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white">
          {story.ownerInitials}
        </span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h2 className="truncate text-base font-bold text-white">{story.name}</h2>
        <p className="mt-0.5 text-xs text-white/50">
          {story.isOwn ? 'Your story' : `by ${story.ownerName}`} · {story.slides.length}{' '}
          {story.slides.length === 1 ? 'moment' : 'moments'}
        </p>
        {story.description && (
          <p className="mt-1 line-clamp-2 text-xs text-white/40">{story.description}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-white/40">
          {story.spotifyUrl && <span>🎵 Soundtrack</span>}
          {likeCount > 0 && <span>❤️ {likeCount}</span>}
        </div>
      </div>
      <span className="self-center text-white/30">›</span>
    </button>
  )
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: string
  title: string
  message: string
}) {
  return (
    <div className="rounded-tudu-lg bg-app-dark-elevated px-6 py-10 text-center ring-1 ring-white/10">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-white/50">{message}</p>
    </div>
  )
}
