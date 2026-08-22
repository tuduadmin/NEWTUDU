import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isIosSafari,
  isStandaloneDisplayMode,
  runInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../lib/pwaInstall'

const PROMPT_WAIT_MS = 800
const PROMPT_POLL_MS = 50

function waitForDeferredPrompt(
  getPrompt: () => BeforeInstallPromptEvent | null,
  maxMs: number,
): Promise<BeforeInstallPromptEvent | null> {
  return new Promise((resolve) => {
    const existing = getPrompt()
    if (existing) {
      resolve(existing)
      return
    }
    const started = Date.now()
    const tick = () => {
      const prompt = getPrompt()
      if (prompt || Date.now() - started >= maxMs) {
        resolve(prompt)
        return
      }
      window.setTimeout(tick, PROMPT_POLL_MS)
    }
    tick()
  })
}

export function usePwaInstall() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplayMode())
  const [installBusy, setInstallBusy] = useState(false)
  const [installHint, setInstallHint] = useState<string | null>(null)

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      const ev = e as BeforeInstallPromptEvent
      deferredRef.current = ev
      setDeferredPrompt(ev)
    }

    function handleAppInstalled() {
      setIsInstalled(true)
      deferredRef.current = null
      setDeferredPrompt(null)
      setInstallHint(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const runNativeInstall = useCallback(async (prompt: BeforeInstallPromptEvent) => {
    const outcome = await runInstallPrompt(prompt)
    deferredRef.current = null
    setDeferredPrompt(null)
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallHint(null)
    }
    return outcome
  }, [])

  const requestInstall = useCallback(async () => {
    if (isInstalled) return

    setInstallHint(null)

    let prompt = deferredRef.current ?? deferredPrompt
    if (!prompt) {
      setInstallBusy(true)
      prompt = await waitForDeferredPrompt(() => deferredRef.current, PROMPT_WAIT_MS)
      setInstallBusy(false)
    }

    if (prompt) {
      await runNativeInstall(prompt)
      return
    }

    if (isIosSafari()) {
      setInstructionsOpen(true)
      return
    }

    setInstallHint('Use your browser menu (⋮) → Install app, or try again in a moment.')
  }, [deferredPrompt, isInstalled, runNativeInstall])

  const closeInstructions = useCallback(() => {
    setInstructionsOpen(false)
  }, [])

  return {
    isInstalled,
    isIos: isIosSafari(),
    canNativePrompt: Boolean(deferredPrompt ?? deferredRef.current),
    instructionsOpen,
    deferredPrompt,
    installBusy,
    installHint,
    requestInstall,
    closeInstructions,
  }
}
