import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bookmark, ChevronDown, Compass, Plus, Search } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import BucketListLandingHero from '../components/bucket-list/BucketListLandingHero'
import { useBucketListHero } from '../hooks/useBucketListHero'
import VibeBadge from '../components/VibeBadge'
import Toast from '../components/Toast'
import { getCurrentUser } from '../lib/auth'
import BucketListProgressRing from '../components/bucket-list/BucketListProgressRing'
import {
  getDiscoveryFeedLists,
  getMyBucketLists,
  getListCoverImage,
  resolveListDisplayEvents,
  startBucketListCreate,
  type BucketList,
  type PublicBucketList,
} from '../lib/bucketLists'
import { bucketListProgress, getPublicListProgress } from '../lib/bucketListProgress'
import { bucketListDetailPath, bucketListRecapPath } from '../lib/bucketListViewContext'
import type { VibeTag } from '../types/bucketList'
import {
  getCompletedStories,
  getDisplayLikeCount,
  type CompletedStory,
} from '../lib/completedStories'

type HubTab = 'explore' | 'mine'
type MineView = 'lists' | 'completed'

const HUB_PANEL = 'mode-hub-panel'

export default function BucketListDiscoveryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<HubTab>(() =>
    searchParams.get('tab') === 'mine' ? 'mine' : 'explore',
  )
  const [mineView, setMineView] = useState<MineView>(() =>
    searchParams.get('discover') === 'completed' ? 'completed' : 'lists',
  )
  const [publicLists, setPublicLists] = useState<PublicBucketList[]>(() => getDiscoveryFeedLists())
  const [myLists, setMyLists] = useState<BucketList[]>(() => getMyBucketLists())
  const [completedStories, setCompletedStories] = useState<CompletedStory[]>(() =>
    getCompletedStories(),
  )
  const { url: heroUrl, revision: heroRevision } = useBucketListHero()
  const [toast, setToast] = useState<string | null>(null)

  const refreshData = useCallback(() => {
    setPublicLists(getDiscoveryFeedLists())
    setMyLists(getMyBucketLists())
    setCompletedStories(getCompletedStories())
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useEffect(() => {
    const nextTab = searchParams.get('tab') === 'mine' ? 'mine' : 'explore'
    setTab(nextTab)
    setMineView(searchParams.get('discover') === 'completed' ? 'completed' : 'lists')
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('create') !== 'true') return
    const user = getCurrentUser()
    if (user) {
      startBucketListCreate((path) => navigate(path), user)
    } else {
      navigate('/signin')
    }
  }, [searchParams, navigate])

  function selectTab(next: HubTab) {
    setTab(next)
    const params: Record<string, string> = {}
    if (next === 'mine') params.tab = 'mine'
    setSearchParams(params)
  }

  function selectMineView(next: MineView) {
    setMineView(next)
    if (next === 'completed') {
      setSearchParams({ tab: 'mine', discover: 'completed' })
    } else {
      setSearchParams({ tab: 'mine' })
    }
  }

  function openCreate() {
    const user = getCurrentUser()
    if (!user) {
      navigate('/signin')
      return
    }
    const created = startBucketListCreate((path) => navigate(path), user)
    if (!created) {
      setToast('Could not start a new list. Free some browser storage and try again.')
    }
  }

  return (
    <div className="relative app-page-shell pb-[calc(var(--app-bottom-nav-h)+max(0.5rem,env(safe-area-inset-bottom,0px))+2rem)]">
      <AppHeaderBar logoLinkTo="/bucket-list" />

      <BucketListLandingHero
        heroUrl={heroUrl}
        heroRevision={heroRevision}
        onCreate={openCreate}
      />

      <div className="mt-3 px-4 pb-3">
        <div
          className={`mode-hub-tab-rail flex gap-2 p-1.5 ${HUB_PANEL}`}
        >
          {(
            [
              {
                id: 'explore' as const,
                label: 'Explore',
                icon: Compass,
                activeClass: 'bucket-list-hub-tab-explore-active',
              },
              {
                id: 'mine' as const,
                label: 'My lists',
                icon: Bookmark,
                activeClass: 'bucket-list-hub-tab-mine-active',
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-[12px] border-2 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                  active
                    ? t.activeClass
                    : 'mode-hub-segment-inactive border-transparent hover:bg-brown/5'
                }`}
              >
                <Icon size={17} strokeWidth={2.25} aria-hidden />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <main className="px-4">
        {tab === 'explore' ? (
          <ExploreTab
            lists={publicLists}
            onOpenCreate={openCreate}
            onOpenList={(id) => navigate(bucketListDetailPath(id, 'explore'))}
          />
        ) : (
          <MineTab
            view={mineView}
            myLists={myLists}
            completedStories={completedStories}
            onSelectView={selectMineView}
            onOpenCreate={openCreate}
            onOpenList={(id) => navigate(bucketListDetailPath(id, 'mine'))}
            onOpenStory={(id) =>
              navigate(
                id.startsWith('own-')
                  ? bucketListRecapPath(id.slice(4), 'mine')
                  : `/bucket-list/story/${id}`,
              )
            }
          />
        )}
      </main>

      <BottomNav />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

type ExploreProgressFilter = 'all' | 'ongoing' | 'complete'

function ExploreTab({
  lists,
  onOpenCreate,
  onOpenList,
}: {
  lists: PublicBucketList[]
  onOpenCreate: () => void
  onOpenList: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [progressFilter, setProgressFilter] = useState<ExploreProgressFilter>('all')
  const [vibeFilter, setVibeFilter] = useState<VibeTag | 'all'>('all')

  const availableVibes = useMemo(() => {
    const vibes = new Set<VibeTag>()
    for (const list of lists) {
      if (list.vibe) vibes.add(list.vibe)
    }
    return [...vibes].sort((a, b) => a.localeCompare(b))
  }, [lists])

  const filteredLists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return lists.filter((list) => {
      const { isComplete } = getPublicListProgress(list)
      if (progressFilter === 'complete' && !isComplete) return false
      if (progressFilter === 'ongoing' && isComplete) return false
      if (vibeFilter !== 'all' && list.vibe !== vibeFilter) return false
      if (!q) return true
      return (
        list.name.toLowerCase().includes(q) ||
        list.ownerName.toLowerCase().includes(q) ||
        (list.description?.toLowerCase().includes(q) ?? false) ||
        (list.region?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [lists, searchQuery, progressFilter, vibeFilter])

  const progressCounts = useMemo(() => {
    let ongoing = 0
    let complete = 0
    for (const list of lists) {
      if (getPublicListProgress(list).isComplete) complete += 1
      else ongoing += 1
    }
    return { all: lists.length, ongoing, complete }
  }, [lists])

  const hasActiveFilters =
    searchQuery.trim().length > 0 || progressFilter !== 'all' || vibeFilter !== 'all'

  function clearFilters() {
    setSearchQuery('')
    setProgressFilter('all')
    setVibeFilter('all')
  }

  if (lists.length === 0) {
    return (
      <div className="pb-4">
        <EmptyState
          icon="🌍"
          title="No public lists yet"
          message="Create your own bucket list to get started. Public lists from the community will appear here."
          actionLabel="Create"
          onAction={onOpenCreate}
        />
      </div>
    )
  }

  return (
    <div className="pb-4">
      <div className="mode-hub-search-wrap relative mt-2">
        <Search
          size={16}
          className="mode-hub-search-icon pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lists, creators, vibes…"
          className="app-field w-full py-3 pl-10 pr-4 text-sm"
        />
      </div>

      <div className={`mt-3 flex p-1 ${HUB_PANEL}`}>
        {(
          [
            { id: 'all' as const, label: 'All' },
            { id: 'ongoing' as const, label: 'Ongoing' },
            { id: 'complete' as const, label: 'Complete' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setProgressFilter(t.id)}
            className={`flex-1 rounded-[12px] py-2 text-xs font-bold transition ${
              progressFilter === t.id
                ? 'mode-hub-segment-active'
                : 'mode-hub-segment-inactive hover:text-brown'
            }`}
          >
            {t.label} ({progressCounts[t.id]})
          </button>
        ))}
      </div>

      {availableVibes.length > 0 && (
        <div className={`mt-3 ${HUB_PANEL} p-3`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brown/45">Vibe</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="theme-accent-text text-[11px] font-semibold transition hover:opacity-80"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="relative mt-2">
            <select
              id="explore-vibe-filter"
              value={vibeFilter}
              onChange={(e) => setVibeFilter(e.target.value as VibeTag | 'all')}
              className="app-field w-full appearance-none py-2.5 pl-3 pr-10 text-sm font-semibold"
            >
              <option value="all">All vibes</option>
              {availableVibes.map((vibe) => (
                <option key={vibe} value={vibe}>
                  {vibe}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brown/45"
              aria-hidden
            />
          </div>
        </div>
      )}

      {filteredLists.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🔍"
            title="No lists match"
            message="Try another vibe, status, or search term."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filteredLists.map((list) => (
            <li key={list.id}>
              <PublicListCard list={list} onClick={() => onOpenList(list.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MineTab({
  view,
  myLists,
  completedStories,
  onSelectView,
  onOpenCreate,
  onOpenList,
  onOpenStory,
}: {
  view: MineView
  myLists: BucketList[]
  completedStories: CompletedStory[]
  onSelectView: (v: MineView) => void
  onOpenCreate: () => void
  onOpenList: (id: string) => void
  onOpenStory: (id: string) => void
}) {
  return (
    <div className="pb-4">
      <div className={`flex p-1 ${HUB_PANEL}`}>
        {(
          [
            { id: 'lists' as const, label: 'My Lists' },
            { id: 'completed' as const, label: 'Completed' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectView(t.id)}
            className={`flex-1 rounded-[14px] py-2.5 text-sm font-semibold transition ${
              view === t.id ? 'mode-hub-segment-active' : 'mode-hub-segment-inactive hover:text-brown'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'lists' ? (
        <div className="mt-4 space-y-3">
          <CreateListButton onOpenCreate={onOpenCreate} dashed />

          {myLists.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No lists yet"
              message="Create a list or copy one while you browse Explore."
            />
          ) : (
            myLists.map((list) => {
              const events = resolveListDisplayEvents(list)
              const { done, total } = bucketListProgress(events, list.completedIds)
              return (
                <ListCard
                  key={list.id}
                  title={list.name}
                  subtitle={`${total} items${list.isPrivate === true ? ' · Private' : ''}`}
                  image={getListCoverImage(list)}
                  progressDone={done}
                  progressTotal={total}
                  onClick={() => onOpenList(list.id)}
                />
              )
            })
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {completedStories.length === 0 ? (
            <EmptyState
              icon="✨"
              title="No completed lists yet"
              message="Mark items complete on your lists or check back for community stories."
            />
          ) : (
            completedStories.map((story) => (
              <CompletedStoryCard
                key={story.id}
                story={story}
                likeCount={getDisplayLikeCount(story)}
                onClick={() => onOpenStory(story.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function CreateListButton({
  onOpenCreate,
  dashed,
}: {
  onOpenCreate: () => void
  dashed?: boolean
}) {
  if (dashed) {
    return (
      <button
        type="button"
        onClick={onOpenCreate}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-white/20 py-4 text-sm font-semibold text-sunset-orange transition hover:border-sunset-orange/50"
      >
        <Plus size={16} aria-hidden />
        Create
      </button>
    )
  }

  return (
    <GradientButton type="button" fullWidth className="px-4 py-2 text-sm" onClick={onOpenCreate}>
      <Plus size={16} className="mr-1 inline" aria-hidden />
      Create
    </GradientButton>
  )
}

function PublicListCard({ list, onClick }: { list: PublicBucketList; onClick: () => void }) {
  const { total, done, isComplete } = getPublicListProgress(list)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 p-2.5 text-left transition hover:border-sunset-orange/30 active:scale-[0.99] ${HUB_PANEL}`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-cream-dark">
        <img
          src={list.coverImage}
          alt=""
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-sm font-bold text-brown">{list.name}</h2>
        <p className="mt-0.5 truncate text-xs text-brown/60">by {list.ownerName}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <VibeBadge vibe={list.vibe ?? 'Adventurous'} />
          <span className="text-[11px] text-brown/50">
            {total} {total === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>
      {total > 0 ? (
        <div className="flex shrink-0 flex-col items-center gap-0.5 self-center pr-0.5">
          <BucketListProgressRing
            done={done}
            total={total}
            size={48}
            variant="light"
            complete={isComplete}
          />
          <span
            className={`text-[9px] font-bold uppercase tracking-wide ${
              isComplete ? 'text-success' : 'text-brown/45'
            }`}
          >
            {isComplete ? 'Complete' : 'Ongoing'}
          </span>
        </div>
      ) : (
        <span className="shrink-0 self-center pr-1 text-brown/35" aria-hidden>
          ›
        </span>
      )}
    </button>
  )
}

function ListCard({
  title,
  subtitle,
  image,
  progressDone,
  progressTotal,
  onClick,
}: {
  title: string
  subtitle: string
  image?: string
  progressDone?: number
  progressTotal?: number
  onClick: () => void
}) {
  const showProgress =
    progressTotal != null && progressTotal > 0 && progressDone != null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full overflow-hidden text-left transition hover:border-sunset-orange/30 active:scale-[0.99] ${HUB_PANEL}`}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-cream-dark text-2xl">📋</span>
        )}
      </div>
      <div className="min-w-0 flex-1 p-3 py-2.5">
        <h2 className="truncate font-display text-base font-bold text-brown">{title}</h2>
        <p className="mt-0.5 text-xs text-brown/60">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-center pr-3">
        {showProgress && (
          <BucketListProgressRing done={progressDone} total={progressTotal} size={48} variant="light" />
        )}
        <span className="text-brown/35" aria-hidden>
          ›
        </span>
      </div>
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
      className={`flex w-full gap-3 p-3 text-left transition hover:border-sunset-orange/30 ${HUB_PANEL}`}
    >
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[14px] bg-cream-dark">
        <img src={story.coverImage} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-lg">
          ▶
        </span>
        <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white">
          {story.ownerInitials}
        </span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h2 className="truncate text-base font-bold text-brown">{story.name}</h2>
        <p className="mt-0.5 text-xs text-brown/60">
          {story.isOwn ? 'Your recap' : `by ${story.ownerName}`} · {story.slides.length}{' '}
          {story.slides.length === 1 ? 'item' : 'items'}
        </p>
        {story.description && (
          <p className="mt-1 line-clamp-2 text-xs text-brown/55">{story.description}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-brown/50">
          {story.spotifyUrl && <span>🎵 Soundtrack</span>}
          {likeCount > 0 && <span>❤️ {likeCount}</span>}
        </div>
      </div>
      <span className="self-center text-brown/35">&gt;</span>
    </button>
  )
}

function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: string
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className={`mt-4 px-6 py-10 text-center ${HUB_PANEL}`}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-app-surface text-2xl">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-brown">{title}</h2>
      <p className="mt-1 text-sm text-brown/65">{message}</p>
      {actionLabel && onAction && (
        <GradientButton
          type="button"
          onClick={onAction}
          className="mt-4 inline-block rounded-[14px] px-6 py-2.5 text-sm font-bold"
        >
          {actionLabel}
        </GradientButton>
      )}
    </div>
  )
}
