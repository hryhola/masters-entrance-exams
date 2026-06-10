import { createHashRouter } from 'react-router-dom'

import { DashboardPage } from '../pages/DashboardPage'
import { NotFoundPage, RouteErrorPage } from '../pages/ErrorPages'
import { ExamsPage } from '../pages/ExamsPage'
import {
  PracticeSetupPage,
  ProgressPage,
  ResultsPage,
  ReviewPage,
  SessionPage,
  SettingsPage,
} from '../pages/PlaceholderPages'
import { AppShell } from './AppShell'
import {
  LazyDatasetInspectorPage,
  LazyExamDetailPage,
  LazyQuestionPage,
} from './LazyDatasetRoutes'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'exams',
        element: <ExamsPage />,
      },
      {
        path: 'exams/:examId',
        element: <LazyExamDetailPage />,
      },
      {
        path: 'exams/:examId/questions/:questionNumber',
        element: <LazyQuestionPage />,
      },
      {
        path: 'dev/datasets/:datasetId',
        element: <LazyDatasetInspectorPage />,
      },
      {
        path: 'practice/setup',
        element: <PracticeSetupPage />,
      },
      {
        path: 'practice/:sessionId',
        element: <SessionPage />,
      },
      {
        path: 'results/:sessionId',
        element: <ResultsPage />,
      },
      {
        path: 'review',
        element: <ReviewPage />,
      },
      {
        path: 'progress',
        element: <ProgressPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
