import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-sky-400 hover:text-sky-300 transition-colors"
        >
          GYMAPP
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/profile"
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Profil
          </Link>
          <Link
            to="/my-reservations"
            className="text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Rezerwacje
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
          <Link
            to="/contact"
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Dla siłowni
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden sm:inline-block">
                Cześć, <span className="text-white">{user?.email}</span>
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="rounded-full text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 cursor-pointer"
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
