import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export const Footer = () => {
  const { user, isAuthenticated } = useAuth();
  const [showCookies, setShowCookies] = useState(false);

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem("gymApp_cookies");
    if (!cookiesAccepted) {
      setShowCookies(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("gymApp_cookies", "true");
    setShowCookies(false);
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 flex w-full flex-col">
      {showCookies && (
        <div className="flex w-full flex-wrap items-center justify-center gap-4 border-t border-zinc-800 bg-zinc-900 p-3 shadow-2xl">
          <p className="text-center text-xs text-zinc-400 sm:text-left">
            Nasza strona używa plików cookies w celu świadczenia usług. Korzystając z serwisu,
            akceptujesz naszą{" "}
            <Link
              to="/privacy"
              className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
            >
              Politykę Prywatności
            </Link>
            .
          </p>
          <Button
            onClick={acceptCookies}
            className="h-auto rounded-full bg-sky-500 px-6 py-1 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-400"
          >
            Rozumiem
          </Button>
        </div>
      )}

      <footer className="w-full border-t border-zinc-800/50 bg-black/80 py-3 backdrop-blur-md">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6">
          {/* LEWA STRONA */}
          <div className="flex items-center gap-6">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              developed by <span className="text-zinc-300">IJFSMJK-uj</span>
            </div>
          </div>

          {/* SRODEK: Przyciski */}
          <div className="flex flex-1 flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4">
            <Link
              to="/faq"
              className="text-sm font-semibold text-zinc-400 transition-colors hover:text-white"
            >
              FAQ
            </Link>
            <Link
              to="/privacy"
              className="text-sm font-semibold text-zinc-400 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              to="/tos"
              className="text-sm font-semibold text-zinc-400 transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
          </div>

          {/* PRAWA STRONA: Status logowania */}
          <div className="flex items-center gap-4 text-sm font-medium">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 md:text-sm">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                  <span className="hidden sm:inline">Jesteś zalogowany jako: </span>
                  <span className="text-white">{user?.email}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] italic text-zinc-500 md:text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-700" />
                Nie jesteś zalogowany
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
