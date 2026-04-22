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
    <>
      {showCookies && (
        <div className="fixed bottom-[48px] left-0 w-full bg-zinc-900 border-t border-zinc-800 p-3 z-40 flex flex-col sm:flex-row justify-center items-center gap-4 shadow-2xl">
          <p className="text-xs text-zinc-400 text-center sm:text-left">
            Nasza strona używa plików cookies w celu świadczenia usług. Korzystając z serwisu,
            akceptujesz naszą{" "}
            <Link
              to="/privacy"
              className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
            >
              Politykę Prywatności
            </Link>
            .
          </p>
          <Button
            onClick={acceptCookies}
            className="text-[10px] uppercase font-black tracking-widest bg-sky-500 hover:bg-sky-400 text-white rounded-full px-6 py-1 h-auto"
          >
            Rozumiem
          </Button>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-zinc-800/50 py-3 z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          {/* LEWA STRONA */}
          <div className="flex items-center gap-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold hidden md:block">
              developed by <span className="text-zinc-300">IJFSMJK-uj</span>
            </div>
          </div>

          {/* SRODEK: Przyciski */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/faq"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              FAQ
            </Link>
            <Link
              to="/privacy"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/tos"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>

          {/* PRAWA STRONA: Status logowania */}
          <div className="flex items-center gap-4 text-sm font-medium">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-zinc-400 text-[11px] md:text-sm">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
                  <span className="hidden md:inline">Jesteś zalogowany jako: </span>
                  <span className="text-white">{user?.email}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 italic text-[11px] md:text-sm">
                <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                Nie jesteś zalogowany
              </div>
            )}
          </div>
        </div>
      </footer>
    </>
  );
};
