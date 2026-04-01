import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

export const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
          Nowy dzień <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
            Nowy trening z GYMAPP{" "}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mx-auto">
          Zarządzaj treningami, śledź postępy i ćwicz pod okiem najlepszych. Wszystko w jednym
          miejscu.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {/* jesli nie zalogowany przycisk login */}
          {!isAuthenticated && (
            <Button
              asChild
              size="lg"
              className="rounded-full bg-sky-500 hover:bg-sky-400 text-white px-8 py-6 text-lg shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all"
            >
              <Link to="/auth">Rozpocznij trening</Link>
            </Button>
          )}

          {/* jesli zalogowany przycisk dashboard */}
          {isAuthenticated && (
            <Button
              asChild
              size="lg"
              className="rounded-full bg-zinc-100 hover:bg-white text-black px-8 py-6 text-lg transition-all"
            >
              <Link to="/dashboard">Przejdź do panelu</Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-zinc-700 text-white hover:bg-zinc-800 px-8 py-6 text-lg"
          >
            <Link to="/gyms">Znajdź siłownię</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-zinc-700 text-white hover:bg-zinc-800 px-8 py-6 text-lg"
          >
            <Link to="/trainers">Poznaj trenerów</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
