import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './routes/LandingPage';
import { LoginPage } from './routes/auth/LoginPage';
import { RegisterPage } from './routes/auth/RegisterPage';
import { ForgotPasswordPage } from './routes/auth/ForgotPasswordPage';
import { DashboardPlaceholder } from './routes/app/DashboardPlaceholder';
import { RequireAuth } from './components/auth/RequireAuth';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/recuperar" element={<ForgotPasswordPage />} />
      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <DashboardPlaceholder />
          </RequireAuth>
        }
      />
      <Route
        path="*"
        element={
          <div className="flex min-h-dvh items-center justify-center p-8 text-center">
            <div>
              <h1 className="font-display text-6xl">404</h1>
              <p className="mt-4 text-atlas-white/70">Esta página no existe en Atlas.</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
