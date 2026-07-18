import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { seedDemoUser } from './lib/auth'
import { getPublicBucketLists, seedDemoBucketLists } from './lib/bucketLists'
import { getCompletedStories } from './lib/completedStories'
import './index.css'

seedDemoUser()
seedDemoBucketLists()
getPublicBucketLists()
getCompletedStories()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
