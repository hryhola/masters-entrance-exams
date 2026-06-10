import { createHashRouter } from 'react-router-dom'

import { DashboardPage } from '../pages/DashboardPage'
import { NotFoundPage, RouteErrorPage } from '../pages/ErrorPages'
import { ExamsPage } from '../pages/ExamsPage'
import {
  ProgressPage,
  ReviewPage,
  SettingsPage,
} from '../pages/PlaceholderPages'
import { AppShell } from './AppShell'
import {
  LazyDatasetInspectorPage,
  LazyExamDetailPage,
  LazyQuestionPage,
} from './LazyDatasetRoutes'
import {
  LazyPracticeSetupPage,
  LazyResultsPage,
  LazySessionPage,
} from './LazyPracticeRoutes'

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
        element: <LazyPracticeSetupPage />,
      },
      {
        path: 'practice/:sessionId',
        element: <LazySessionPage />,
      },
      {
        path: 'results/:sessionId',
        element: <LazyResultsPage />,
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
