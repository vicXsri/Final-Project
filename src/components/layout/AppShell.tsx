// The outer shell keeps the main nav and footer around every page.
// The outer shell keeps the main nav and footer around every page.
// The outer shell keeps the main nav and footer around every page.
import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { WizardRouteGuard } from "@/features/wizard/components/WizardRouteGuard";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/project", label: "Project" },
  { href: "/about", label: "About" },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_42%,#f8fafc_100%)]">
      <WizardRouteGuard />
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-white/80 backdrop-blur transition">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold text-slate-900">
            Design and Development of a Modular Web Application for THz Quantum Cascade Laser Characterisation
          </Link>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-sm transition",
                    isActive ? "bg-[var(--color-ocean)] text-white" : "text-[var(--color-slate)] hover:bg-white",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-line)] bg-white/78 backdrop-blur">
        <div className="mx-auto flex max-w-7xl justify-end px-6 py-6 text-sm text-[var(--color-slate)]">
          <div>Leeds Final Project</div>
        </div>
      </footer>
    </div>
  );
}
