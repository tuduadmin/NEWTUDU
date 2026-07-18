import type { DiscoverEvent } from '../data/discoverEvents'

export type VibeTag =
  | 'Adventurous'
  | 'Chill'
  | 'Romantic'
  | 'Family'
  | 'Foodie'
  | 'Wild'
  | 'Local'
  | 'Luxury'
  | 'Weekend'
  | 'Road Trip'

export type User = {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  initials: string
  bio?: string
  location?: string
  isVerified?: boolean
  followerCount?: number
  followingCount?: number
  completedCount?: number
  bucketListCount?: number
  profileSoundtrack?: SpotifyPlaylist
  isPrivate?: boolean
}

export type Experience = DiscoverEvent & {
  description?: string
  hostName?: string
  hostAvatarUrl?: string
  saveCount?: number
  season?: string
  mapPreviewUrl?: string
  ticketUrl?: string
  instagramMedia?: InstagramMedia[]
}

export type SpotifyPlaylist = {
  id: string
  name: string
  ownerName: string
  coverImageUrl: string
  trackCount: number
  spotifyUrl: string
  previewUrl?: string
}

export type InstagramMedia = {
  id: string
  thumbnailUrl: string
  permalink: string
  type: 'video' | 'photo'
}

export type BucketListItem = {
  id: string
  experienceId: string
  experience?: Experience
  addedAt: string
  note?: string
  isCompleted: boolean
  completion?: Completion
}

export type Completion = {
  id: string
  experienceId: string
  bucketListId: string
  completedAt: string
  writeUp?: string
  rating?: 1 | 2 | 3 | 4 | 5
  photoUrls?: string[]
  videoUrl?: string
  taggedUserIds?: string[]
  completedWith?: string[]
  isPublic: boolean
  shareAfterComplete?: boolean
}

export type ShareCardConfig = {
  variant: 'cinematic' | 'scrapbook' | 'minimal'
  experienceTitle: string
  location: string
  completedAt: string
  writeUp?: string
  userDisplayName: string
  userAvatarUrl?: string
  experienceImageUrl: string
  bucketListName?: string
  progressLabel?: string
  showQrCode?: boolean
  hiddenElements?: string[]
  exportWidth: 1080
  exportHeight: 1920
}

export type BucketList = {
  id: string
  name: string
  description?: string
  coverImageUrl?: string
  ownerId?: string
  owner?: User
  vibe?: VibeTag
  region?: string
  eventIds: string[]
  items?: BucketListItem[]
  createdAt: string
  updatedAt: string
  spotifyUrl?: string
  soundtrack?: SpotifyPlaylist
  instagramMedia?: InstagramMedia[]
  completedIds: string[]
  completionNotes?: Record<string, string>
  completionPhotos?: Record<string, string>
  completedAt?: Record<string, string>
  isPrivate?: boolean
  likeCount?: number
  saveCount?: number
}

export type PublicBucketList = {
  id: string
  name: string
  ownerName: string
  ownerInitials: string
  ownerAvatarUrl?: string
  ownerVerified?: boolean
  coverImage: string
  description: string
  region?: string
  vibe?: VibeTag
  itemCount: number
  completedCount: number
  likeCount?: number
  saveCount?: number
  hasSoundtrack?: boolean
  soundtrack?: SpotifyPlaylist
  events: DiscoverEvent[]
}
