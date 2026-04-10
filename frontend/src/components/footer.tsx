import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export const Footer = () => {
  const { userEmail, logout } = useAuth();

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-zinc-800/50 py-3 z-50">
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* LEWA STRONA: Developer info */}
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
          developed by <span className="text-zinc-300">IJFSMJK-uj</span>
        </div>

        {/* SRODEK: Przyciski */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/faq"
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            {" "}
            FAQ{" "}
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            {" "}
            Privacy Policy{" "}
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            {" "}
            Terms of Service
          </Link>
        </div>

        {/* PRAWA STRONA: Status logowania */}
        <div className="flex items-center gap-4 text-sm font-medium">
          {userEmail ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                Jesteś zalogowany jako: <span className="text-white">{userEmail}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 italic">
              <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
              Nie jesteś zalogowany
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
