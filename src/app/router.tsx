import { Navigate, Route, Routes } from 'react-router'

import NotFoundPage from '../pages/not-found-page'
import OverviewPage from '../pages/overview-page'
import RequestCardPage from '../pages/request-card-page'
import RequestsListPage from '../pages/requests-list-page'
import AppLayout from './app-layout'

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/overview" replace />} />
    <Route element={<AppLayout />}>
      <Route path="/overview" element={<OverviewPage />} />
      <Route path="/requests" element={<RequestsListPage />} />
      <Route path="/requests/:requestId" element={<RequestCardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
)

export default AppRoutes
