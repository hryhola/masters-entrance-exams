import { lazy, Suspense, type ReactNode } from 'react'

const ExamDetailPage = lazy(() =>
  import('../pages/DatasetPages').then((module) => ({
    default: module.ExamDetailPage,
  })),
)
const QuestionPage = lazy(() =>
  import('../pages/DatasetPages').then((module) => ({
    default: module.QuestionPage,
  })),
)
const DatasetInspectorPage = lazy(() =>
  import('../pages/DatasetPages').then((module) => ({
    default: module.DatasetInspectorPage,
  })),
)

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <section aria-live="polite" className="dataset-state">
          <span className="dataset-spinner" />
          <p>Завантажуємо модуль контенту…</p>
        </section>
      }
    >
      {children}
    </Suspense>
  )
}

export function LazyExamDetailPage() {
  return (
    <LazyPage>
      <ExamDetailPage />
    </LazyPage>
  )
}

export function LazyQuestionPage() {
  return (
    <LazyPage>
      <QuestionPage />
    </LazyPage>
  )
}

export function LazyDatasetInspectorPage() {
  return (
    <LazyPage>
      <DatasetInspectorPage />
    </LazyPage>
  )
}
