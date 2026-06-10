import { lazy, Suspense, type ReactNode } from 'react'

import { DatasetLoading } from '../content/DatasetState'

const ProgressPage = lazy(() =>
  import('../pages/ProgressPages').then((module) => ({
    default: module.ProgressPage,
  })),
)
const ReviewPage = lazy(() =>
  import('../pages/ProgressPages').then((module) => ({
    default: module.ReviewPage,
  })),
)
const SettingsPage = lazy(() =>
  import('../pages/ProgressPages').then((module) => ({
    default: module.SettingsPage,
  })),
)

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<DatasetLoading />}>{children}</Suspense>
}

export function LazyProgressPage() {
  return (
    <LazyPage>
      <ProgressPage />
    </LazyPage>
  )
}

export function LazyReviewPage() {
  return (
    <LazyPage>
      <ReviewPage />
    </LazyPage>
  )
}

export function LazySettingsPage() {
  return (
    <LazyPage>
      <SettingsPage />
    </LazyPage>
  )
}
