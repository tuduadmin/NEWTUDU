import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, NewspaperIcon } from '@heroicons/react/24/solid'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../../lib/prefChoiceClasses'

type MyTuduTab = 'home' | 'feed'

const TAB_LAYOUT =
  'flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs no-underline'

function tabIconClass(active: boolean) {
  return `pref-choice-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
    active ? '' : 'bg-brown/5 text-brown-muted'
  }`
}

function tabLabelClass(active: boolean) {
  return `pref-choice-label ${active ? PREF_CHOICE_ACTIVE_TEXT : 'font-medium text-brown-muted'}`
}

export default function MyTuduTabBar() {
  const { pathname } = useLocation()
  const tab: MyTuduTab = pathname.startsWith('/my-tudu/feed') ? 'feed' : 'home'

  return (
    <nav className="mt-3 flex gap-2" role="tablist" aria-label="My Tudu sections">
      <Link
        to="/my-tudu"
        role="tab"
        aria-selected={tab === 'home'}
        className={prefChoiceClasses(tab === 'home', TAB_LAYOUT)}
      >
        <span className={tabIconClass(tab === 'home')}>
          <HomeIcon className="h-4 w-4" aria-hidden />
        </span>
        <span className={tabLabelClass(tab === 'home')}>Home</span>
      </Link>
      <Link
        to="/my-tudu/feed"
        role="tab"
        aria-selected={tab === 'feed'}
        className={prefChoiceClasses(tab === 'feed', TAB_LAYOUT)}
      >
        <span className={tabIconClass(tab === 'feed')}>
          <NewspaperIcon className="h-4 w-4" aria-hidden />
        </span>
        <span className={tabLabelClass(tab === 'feed')}>Feed</span>
      </Link>
    </nav>
  )
}
