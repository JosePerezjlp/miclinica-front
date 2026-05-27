import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginContainer from "./features/Login/Login.container";
import RegisterContainer from "./features/Register/Register.container";
import DashboardContainer from "./features/Dashboard/Dashboard.container";
import AffiliateGroupsContainer from "./features/AffiliateGroups/AffiliateGroups.container";
import PlansContainer from "./features/Plans/Plans.container";
import PromotersContainer from "./features/Promoters/Promoters.container";
import AffiliateGroupsDetailContainer from "./features/AffiliateGroups/AffiliateGroups.detail.container";
import DashboardLayout from "./components/DashboardLayout";
import { useAppSelector } from "./store/hooks";

type RouteChildren = {
  children: ReactElement;
};

function ProtectedRoute({ children }: RouteChildren) {
  const token = useAppSelector((state) => state.login.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }: RouteChildren) {
  const token = useAppSelector((state) => state.login.token);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginContainer />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterContainer />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardContainer />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/affiliate-groups"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AffiliateGroupsContainer />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PlansContainer />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/promoters"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PromotersContainer />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/affiliate-groups/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AffiliateGroupsDetailContainer />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/grupos-afiliados"
          element={<Navigate to="/affiliate-groups" replace />}
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
