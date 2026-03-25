import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/authService";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export const ProfilePage = () => {
  const { logout, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [role, setRole] = useState("MEMBER");
  const [editingRole, setEditingRole] = useState(false);
  const [gym, setGym] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authService.getProfile();
        if (data.error) {
          setError(data.error);
          return;
        }
        setEmail(data.email || "");
        setUsername(data.username || "");
        setRole(data.role || "MEMBER");
        setGym(data.gym);
      } catch {
        setError("Nie udało się pobrać profilu");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const validate = () => {
    if (editingEmail) {
      if (!email) {
        setError("Email jest wymagany");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Podaj prawidłowy adres email");
        return false;
      }
    }
    if (editingUsername && username) {
      if (username.length < 3) {
        setError("Minimum 3 znaki");
        return false;
      }
      if (username.length > 20) {
        setError("Maksymalnie 20 znaków");
        return false;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError("Tylko litery, cyfry i _");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    if (!validate()) return;

    const dataToUpdate: { email?: string; username?: string; role?: string } =
      {};
    if (editingEmail) dataToUpdate.email = email;
    if (editingUsername) dataToUpdate.username = username;
    if (editingRole) dataToUpdate.role = role;

    if (Object.keys(dataToUpdate).length === 0) {
      setError("Kliknij w pole które chcesz zmienić");
      return;
    }

    try {
      const data = await authService.updateProfile(dataToUpdate);
      if (data.error) {
        setError(data.error);
        return;
      }
      setSuccess("Profil zaktualizowano pomyślnie");
      setEditingEmail(false);
      setEditingUsername(false);
      setEditingRole(false);
      if (editingEmail) localStorage.setItem("userEmail", email);
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white">Ładowanie profilu...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-white mb-4">
          Musisz się zalogować, aby edytować profil.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/auth")}
          className="cursor-pointer"
        >
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-lg bg-black border border-zinc-800 rounded-3xl">
        <CardHeader className="text-center pt-8">
          <CardTitle>Edytuj profil</CardTitle>
          <CardDescription>Kliknij w pole aby je edytować</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          {error && (
            <div className="text-sm text-red-300 p-2 bg-red-500/10 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-emerald-300 p-2 bg-emerald-500/10 rounded-md">
              {success}
            </div>
          )}

          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-400">
              E-mail{" "}
              {editingEmail && (
                <span className="text-sky-400 normal-case">(edytujesz)</span>
              )}
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!editingEmail}
              onFocus={() => setEditingEmail(true)}
              className={`w-full cursor-pointer transition-colors ${
                editingEmail
                  ? "border-sky-500 bg-zinc-900"
                  : "border-zinc-700 bg-zinc-950 text-zinc-400"
              }`}
            />
          </div>

          {/* USERNAME */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-400">
              Nazwa użytkownika{" "}
              {editingUsername && (
                <span className="text-sky-400 normal-case">(edytujesz)</span>
              )}
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              readOnly={!editingUsername}
              onFocus={() => setEditingUsername(true)}
              className={`w-full cursor-pointer transition-colors ${
                editingUsername
                  ? "border-sky-500 bg-zinc-900"
                  : "border-zinc-700 bg-zinc-950 text-zinc-400"
              }`}
            />
          </div>

          {/* ROLA */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-400">
              Rola{" "}
              {editingRole && (
                <span className="text-sky-400 normal-case">(edytujesz)</span>
              )}
            </label>
            <div className="flex gap-2">
              {["MEMBER", "TRAINER", "GYM"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setEditingRole(true);
                    setRole(option);
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    role === option
                      ? "bg-sky-500 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {option === "MEMBER" && "Member"}
                  {option === "TRAINER" && "Trainer"}
                  {option === "GYM" && "Gym"}
                </button>
              ))}
            </div>
          </div>

          {/* SIŁOWNIA */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-400">
              Twoja siłownia
            </label>
            {gym ? (
              <Link
                to={`/gyms/${gym.id}`}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-sky-500 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-white font-medium">{gym.name}</p>
                  <p className="text-zinc-400 text-xs">{gym.address}</p>
                </div>
                <span className="text-sky-400 text-xs">Zobacz</span>
              </Link>
            ) : (
              <Link
                to="/gyms"
                className="flex items-center justify-center w-full p-3 rounded-xl bg-zinc-900 border border-dashed border-zinc-700 hover:border-sky-500 transition-colors cursor-pointer"
              >
                <span className="text-zinc-400 text-sm">
                  + Wybierz siłownię
                </span>
              </Link>
            )}
          </div>

          {role === "GYM" && (
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400">
                Zaproszenia dla trenerów
              </label>
              <Link
                to="/gym/invites/trainers"
                className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-sky-500 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-white font-medium">
                    Stwórz link zaproszenia dla trenera
                  </p>
                  <p className="text-zinc-400 text-xs">
                    Generuj i zarządzaj aktywnymi linkami
                  </p>
                </div>
                <span className="text-sky-400 text-xs">Przejdź</span>
              </Link>
            </div>
          )}
          
          {role === 'TRAINER' && (
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">Dostępność trenera</label>
                <Link
                  to="/trainer/availability"
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-sky-500 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-white font-medium">Ustaw godziny dostępności</p>
                    <p className="text-zinc-400 text-xs">Dodaj dni i godziny pracy</p>
                  </div>
                  <span className="text-sky-400 text-xs">Przejdź</span>
                </Link>
              </div>
          )}

          <div className="flex gap-2 mt-2">
            <Button onClick={handleSave} className="w-1/2 cursor-pointer">
              Zapisz
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="w-1/2 cursor-pointer"
            >
              Wyloguj
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
