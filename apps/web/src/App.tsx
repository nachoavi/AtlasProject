import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './routes/LandingPage';
import { LoginPage } from './routes/auth/LoginPage';
import { RegisterPage } from './routes/auth/RegisterPage';
import { ForgotPasswordPage } from './routes/auth/ForgotPasswordPage';
import { MemberDashboard } from './routes/app/MemberDashboard';
import { QrCheckinPage } from './routes/app/QrCheckinPage';
import { BookingsPage } from './routes/app/BookingsPage';
import { NewBookingPage } from './routes/app/NewBookingPage';
import { WorkshopsPage } from './routes/app/WorkshopsPage';
import { EventsPage } from './routes/app/EventsPage';
import { SessionPacksPage } from './routes/app/SessionPacksPage';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequireRole } from './components/auth/RequireRole';
import { StaffLayout } from './routes/staff/StaffLayout';
import { StaffDashboard } from './routes/staff/StaffDashboard';
import { EnrollWizard } from './routes/staff/EnrollWizard';
import { CashRegister } from './routes/staff/CashRegister';
import { CheckinPage } from './routes/staff/CheckinPage';
import { WorkshopsAdmin } from './routes/staff/WorkshopsAdmin';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/recuperar" element={<ForgotPasswordPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <MemberDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/app/qr"
        element={
          <RequireAuth>
            <QrCheckinPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/reservas"
        element={
          <RequireAuth>
            <BookingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/reservas/nueva"
        element={
          <RequireAuth>
            <NewBookingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/talleres"
        element={
          <RequireAuth>
            <WorkshopsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/eventos"
        element={
          <RequireAuth>
            <EventsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/app/sesiones"
        element={
          <RequireAuth>
            <SessionPacksPage />
          </RequireAuth>
        }
      />
      <Route
        path="/staff"
        element={
          <RequireRole roles={['STAFF', 'ADMIN']}>
            <StaffLayout />
          </RequireRole>
        }
      >
        <Route index element={<StaffDashboard />} />
        <Route path="check-in" element={<CheckinPage />} />
        <Route path="inscribir" element={<EnrollWizard />} />
        <Route path="talleres" element={<WorkshopsAdmin />} />
        <Route path="caja" element={<CashRegister />} />
      </Route>
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
