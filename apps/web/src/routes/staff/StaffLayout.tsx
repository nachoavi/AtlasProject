import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, UserPlus, Receipt } from 'lucide-react';
import { useAuth } from '../../stores/auth';
import { cn } from '../../lib/cn';

const NAV = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/inscribir', label: 'Inscribir', icon: UserPlus, end: false },
  { to: '/staff/caja', label: 'Caja del día', icon: Receipt, end: false },
];

export function StaffLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh bg-atlas-black text-atlas-white">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-atlas-white/10 bg-atlas-ink lg:flex">
        <Link to="/staff" className="flex items-center gap-3 border-b border-atlas-white/10 px-6 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-atlas-yellow font-display text-atlas-black">
            A
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg uppercase">Atlas</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-atlas-white/50">
              Recepción
            </span>
          </div>
        </Link>

        <nav className="flex-1 px-4 py-6">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium uppercase tracking-wider transition-colors',
                      isActive
                        ? 'bg-atlas-yellow text-atlas-black'
                        : 'text-atlas-white/70 hover:bg-atlas-white/5 hover:text-atlas-white',
                    )
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-atlas-white/10 px-4 py-4 text-xs">
          <p className="truncate font-semibold">{user?.fullName}</p>
          <p className="truncate text-atlas-white/50">{user?.email}</p>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-atlas-white/20 px-3 py-2 text-xs uppercase tracking-wider transition-colors hover:bg-atlas-white/10"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-atlas-white/10 px-6 py-4 lg:hidden">
          <Link to="/staff" className="font-display text-xl uppercase">
            Atlas · Recepción
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="text-xs uppercase tracking-wider text-atlas-white/70"
          >
            Salir
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-12">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
