import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link
          to="/"
          className={`text-2xl font-extrabold tracking-tight transition-colors ${isAdmin ? "text-red-500 hover:text-red-400" : "text-sky-400 hover:text-sky-300"}`}
        >
          GYMAPP
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {isAdmin ? (
            <>
              <Link
                to="/admin/gyms"
                className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                Siłownie
              </Link>
              <Link
                to="/admin/users"
                className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                Użytkownicy
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Profil
              </Link>
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Panel
              </Link>
              <Link
                to="/gyms"
                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Mapa siłowni
              </Link>
              <Link
                to="/trainers"
                className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Trenerzy
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                  ADMIN
                </span>
              )}
              <span className="text-sm text-zinc-400 hidden sm:inline-block">{user.email}</span>
              <Button
                onClick={logout}
                variant="ghost"
                className={`rounded-full ${isAdmin ? "text-red-400 hover:text-red-300 hover:bg-red-400/10" : "text-sky-400 hover:text-sky-300 hover:bg-sky-400/10"}`}
              >
                Wyloguj
              </Button>
            </div>
          ) : (
            <Button
              asChild
              className="rounded-full bg-sky-500 text-white hover:bg-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            >
              <Link to="/auth">Logowanie / Rejestracja</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
