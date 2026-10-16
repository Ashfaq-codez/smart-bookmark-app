import type { Metadata } from 'next'
import Landing from './Landing'

// The new landing page, built here at /new while the current one stays at /. Swapping them later is one small step.
export const metadata: Metadata = {
  title: 'inntoit · A quiet home for everything you save',
  description: 'Save links, posts, notes and pictures from anywhere. inntoit keeps each one looking like itself, in a calm, private place you can find it again.',
}

export default function NewLandingPage() {
  return <Landing />
}
