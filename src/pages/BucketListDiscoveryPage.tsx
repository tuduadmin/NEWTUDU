import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import VibeBadge from '../components/VibeBadge'
import Toast from '../components/Toast'
import {
  createBucketList,
  getBucketLists,
  getDiscoveryFeedLists,
  getListCoverImage,
  type BucketList,
  type PublicBucketList,
} from '../lib/bucketLists'
import {
  getCompletedStories,
  getDisplayLikeCount,
  type CompletedStory,
} from '../lib/completedStories'

type HubTab = 'explore' | 'mine'
type MineView = 'lists' | 'completed'

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
  const [myLists, setMyLists] = useState<BucketList[]>(() => getBucketLists())
  const [completedStories, setCompletedStories] = useState<CompletedStory[]>(() =>
    getCompletedStories(),
  )
  const [toast, setToast] = useState<string | null>(null)
  const [creating, setCreating] = useState(() => searchParams.get('create') === 'true')
  const [newListName, setNewListName] = useState('')

  const refreshData = useCallback(() => {
    setPublicLists(getDiscoveryFeedLists())
    setMyLists(getBucketLists())
    setCompletedStories(getCompletedStories())
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useEffect(() => {
    const nextTab = searchParams.get('tab') === 'mine' ? 'mine' : 'explore'
    setTab(nextTab)
    setMineView(searchParams.get('discover') === 'completed' ? 'completed' : 'lists')
    if (searchParams.get('create') === 'true') setCreating(true)
  }, [searchParams])

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

  function closeCreate() {
    setCreating(false)
    setNewListName('')
    const params: Record<string, string> = {}
    if (tab === 'mine') params.tab = 'mine'
    setSearchParams(params)
  }

  function handleCreateList() {
    const name = newListName.trim()
    if (!name) return
    const list = createBucketList(name)
    closeCreate()
    refreshData()
    navigate(`/bucket-list/${list.id}`)
  }

  return (
    <div className="relative app-page-shell pb-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))]">
      <AppHeaderBar logoLinkTo="/bucket-list" />

      <div className="px-4 pb-2 pt-2">
        <p className="text-tagline">Bucket List</p>
        <h1 className="font-display text-xl font-extrabold tracking-tight text-brown">Bucket List</h1>
      </div>

      <div className="px-4 pb-3">
        <div className="flex rounded-[14px] border border-app-subtle bg-app-elevated p-1">
          {(
            [
              { id: 'explore' as const, label: 'Explore' },
              { id: 'mine' as const, label: 'My lists' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={`flex-1 rounded-[14px] py-2.5 text-sm font-semibold transition ${
                tab === t.id ? 'bg-orange/10 text-orange' : 'text-brown-muted hover:text-brown'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4">
        {tab === 'explore' ? (
          <ExploreTab
            lists={publicLists}
            creating={creating}
            newListName={newListName}
            onNewListNameChange={setNewListName}
            onOpenCreate={() => setCreating(true)}
            onCloseCreate={closeCreate}
            onCreateList={handleCreateList}
            onOpenList={(id) => navigate(`/bucket-list/${id}`)}
          />
        ) : (
          <MineTab
            view={mineView}
            myLists={myLists}
            completedStories={completedStories}
            creating={creating}
            newListName={newListName}
            onNewListNameChange={setNewListName}
            onSelectView={selectMineView}
            onOpenCreate={() => setCreating(true)}
            onCloseCreate={closeCreate}
            onCreateList={handleCreateList}
            onOpenList={(id) => navigate(`/bucket-list/${id}`)}
            onOpenStory={(id) => navigate(`/bucket-list/story/${id}`)}
          />
        )}
      </main>

      <BottomNav />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function ExploreTab({
  lists,
  creating,
  newListName,
  onNewListNameChange,
  onOpenCreate,
  onCloseCreate,
  onCreateList,
  onOpenList,
}: {
  lists: PublicBucketList[]
  creating: boolean
  newListName: string
  onNewListNameChange: (v: string) => void
  onOpenCreate: () => void
  onCloseCreate: () => void
  onCreateList: () => void
  onOpenList: (id: string) => void
}) {
  return (
    <div className="pb-4">
      <CreateListSection
        creating={creating}
        newListName={newListName}
        onNewListNameChange={onNewListNameChange}
        onOpenCreate={onOpenCreate}
        onCloseCreate={onCloseCreate}
        onCreateList={onCreateList}
      />

      {lists.length === 0 ? (
        <EmptyState
          icon="🌍"
          title="No public lists yet"
          message="Create your own bucket list to get started. Public lists from the community will appear here."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {lists.map((list) => (
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
  creating,
  newListName,
  onNewListNameChange,
  onSelectView,
  onOpenCreate,
  onCloseCreate,
  onCreateList,
  onOpenList,
  onOpenStory,
}: {
  view: MineView
  myLists: BucketList[]
  completedStories: CompletedStory[]
  creating: boolean
  newListName: string
  onNewListNameChange: (v: string) => void
  onSelectView: (v: MineView) => void
  onOpenCreate: () => void
  onCloseCreate: () => void
  onCreateList: () => void
  onOpenList: (id: string) => void
  onOpenStory: (id: string) => void
}) {
  return (
    <div className="pb-4">
      <div className="flex rounded-[14px] border border-app-subtle bg-app-elevated p-1">
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
              view === t.id ? 'bg-orange/10 text-orange' : 'text-brown-muted hover:text-brown'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'lists' ? (
        <div className="mt-4 space-y-3">
          <CreateListSection
            creating={creating}
            newListName={newListName}
            onNewListNameChange={onNewListNameChange}
            onOpenCreate={onOpenCreate}
            onCloseCreate={onCloseCreate}
            onCreateList={onCreateList}
            dashed
          />

          {myLists.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No lists yet"
              message="Create a list or copy one while you browse Explore."
            />
          ) : (
            myLists.map((list) => (
              <ListCard
                key={list.id}
                title={list.name}
                subtitle={`${list.eventIds.length} events | ${list.completedIds.length} done${list.isPrivate === true ? ' | Private' : ''}`}
                image={getListCoverImage(list)}
                onClick={() => onOpenList(list.id)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
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
                onClick={() => onOpenStory(story.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function CreateListSection({
  creating,
  newListName,
  onNewListNameChange,
  onOpenCreate,
  onCloseCreate,
  onCreateList,
  dashed,
}: {
  creating: boolean
  newListName: string
  onNewListNameChange: (v: string) => void
  onOpenCreate: () => void
  onCloseCreate: () => void
  onCreateList: () => void
  dashed?: boolean
}) {
  if (creating) {
    return (
      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-brown-muted">
          New list name
        </label>
        <input
          type="text"
          value={newListName}
          onChange={(e) => onNewListNameChange(e.target.value)}
          placeholder="e.g. Summer Adventures"
          autoFocus
          className="app-field mt-2"
          onKeyDown={(e) => e.key === 'Enter' && onCreateList()}
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCloseCreate}
            className="flex-1 rounded-[14px] border border-brown/15 py-2 text-sm font-semibold text-brown"
          >
            Cancel
          </button>
          <GradientButton
            type="button"
            onClick={onCreateList}
            disabled={!newListName.trim()}
            className="flex-1 rounded-[14px] py-2 text-sm font-semibold disabled:opacity-50"
          >
            Create
          </GradientButton>
        </div>
      </div>
    )
  }

  if (dashed) {
    return (
      <button
        type="button"
        onClick={onOpenCreate}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-brown/20 py-4 text-sm font-semibold text-orange transition hover:border-orange/50"
      >
        <Plus size={16} aria-hidden />
        Create bucket list
      </button>
    )
  }

  return (
    <GradientButton type="button" fullWidth className="px-4 py-2 text-sm" onClick={onOpenCreate}>
      <Plus size={16} className="mr-1 inline" aria-hidden />
      Create bucket list
    </GradientButton>
  )
}

function PublicListCard({ list, onClick }: { list: PublicBucketList; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-[14px] border border-app-subtle bg-app-elevated p-2.5 text-left shadow-sm transition hover:border-orange/20 active:scale-[0.99]"
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
        <p className="mt-0.5 truncate text-xs text-brown-muted">by {list.ownerName}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <VibeBadge vibe={list.vibe ?? 'Adventurous'} />
          <span className="text-[11px] text-brown-muted">
            {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>
      <span className="shrink-0 self-center pr-1 text-brown-muted/40">&gt;</span>
    </button>
  )
}

function ListCard({
  title,
  subtitle,
  image,
  onClick,
}: {
  title: string
  subtitle: string
  image?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated text-left shadow-sm transition hover:border-orange/20 active:scale-[0.99]"
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
        <p className="mt-0.5 text-xs text-brown-muted">{subtitle}</p>
      </div>
      <span className="self-center pr-3 text-brown-muted/40">&gt;</span>
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
      className="flex w-full gap-3 rounded-[14px] border border-app-subtle bg-app-elevated p-3 text-left shadow-sm transition hover:border-orange/20"
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
        <p className="mt-0.5 text-xs text-brown-muted">
          {story.isOwn ? 'Your story' : `by ${story.ownerName}`} | {story.slides.length}{' '}
          {story.slides.length === 1 ? 'moment' : 'moments'}
        </p>
        {story.description && (
          <p className="mt-1 line-clamp-2 text-xs text-brown-muted/80">{story.description}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-brown-muted">
          {story.spotifyUrl && <span>🎵 Soundtrack</span>}
          {likeCount > 0 && <span>❤️ {likeCount}</span>}
        </div>
      </div>
      <span className="self-center text-brown-muted/40">&gt;</span>
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
    <div className="mt-4 rounded-[14px] border border-app-subtle bg-app-elevated px-6 py-10 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-cream-dark text-2xl">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-brown">{title}</h2>
      <p className="mt-1 text-sm text-brown-muted">{message}</p>
    </div>
  )
}
