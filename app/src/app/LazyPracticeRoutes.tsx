import { lazy, Suspense, type ReactNode } from 'react'

import { DatasetLoading } from '../content/DatasetState'

const PracticeSetupPage = lazy(() =>
  import('../pages/PracticePages').then((module) => ({
    default: module.PracticeSetupPage,
  })),
)
const SessionPage = lazy(() =>
  import('../pages/PracticePages').then((module) => ({
    default: module.SessionPage,
  })),
)
const ResultsPage = lazy(() =>
  import('../pages/PracticePages').then((module) => ({
    default: module.ResultsPage,
  })),
)
const DailyPracticePage = lazy(() =>
  import('../pages/LearningPages').then((module) => ({
    default: module.DailyPracticePage,
  })),
)

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<DatasetLoading />}>{children}</Suspense>
}

export function LazyPracticeSetupPage() {
  return (
    <LazyPage>
      <PracticeSetupPage />
    </LazyPage>
  )
}

export function LazySessionPage() {
  return (
    <LazyPage>
      <SessionPage />
    </LazyPage>
  )
}

export function LazyResultsPage() {
  return (
    <LazyPage>
      <ResultsPage />
    </LazyPage>
  )
}

export function LazyDailyPracticePage() {
  return (
    <LazyPage>
      <DailyPracticePage />
    </LazyPage>
  )
}
