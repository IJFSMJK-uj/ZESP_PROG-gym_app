import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/authService";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export const ProfilePage = () => {
  const { logout, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [role, setRole] = useState("MEMBER");
  const [gym, setGym] = useState<any>(null);

  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [resetLoading, setResetLoading] = useState(false);

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

        // NOWE: Ładowanie danych trenera z backendu do stanów
        setProfilePictureUrl(data.profilePictureUrl || "");
        setBio(data.bio || "");
        setTags(data.tags ? data.tags.join(", ") : "");
        setFacebookUrl(data.facebookUrl || "");
        setInstagramUrl(data.instagramUrl || "");
        setDiscordUsername(data.discordUsername || "");
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

    const dataToUpdate: any = {};
    if (editingEmail) dataToUpdate.email = email;
    if (editingUsername) dataToUpdate.username = username;

    if (role === "TRAINER") {
      dataToUpdate.profilePictureUrl = profilePictureUrl;
      dataToUpdate.bio = bio;
      // Zamiana stringa "joga, crossfit" na tablicę ["joga", "crossfit"]
      dataToUpdate.tags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "");
      dataToUpdate.facebookUrl = facebookUrl;
      dataToUpdate.instagramUrl = instagramUrl;
      dataToUpdate.discordUsername = discordUsername;
    }

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

      if (data.emailChanged) {
        setSuccess(
          "Profil zaktualizowany. Na Twój nowy adres wysłaliśmy link weryfikacyjny. Zweryfikuj go, aby zachować dostęp do konta!"
        );
      } else {
        setSuccess("Profil zaktualizowano pomyślnie");
      }
      setEditingEmail(false);
      setEditingUsername(false);
      if (editingEmail) localStorage.setItem("userEmail", email);
    } catch {
      setError("Błąd sieci. Spróbuj ponownie.");
    }
  };

  const handlePasswordResetRequest = async () => {
    setError("");
    setSuccess("");
    setResetLoading(true);

    try {
      const data = await authService.requestPasswordReset(email);
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess("Link do zmiany hasła został wysłany na Twój adres e-mail.");
      }
    } catch {
      setError("Nie udało się wysłać prośby o zmianę hasła.");
    } finally {
      setResetLoading(false);
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
        <p className="text-lg text-white mb-4">Musisz się zalogować, aby edytować profil.</p>
        <Button variant="outline" onClick={() => navigate("/auth")} className="cursor-pointer">
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
            <div className="text-sm text-red-300 p-2 bg-red-500/10 rounded-md">{error}</div>
          )}
          {success && (
            <div className="text-sm text-emerald-300 p-2 bg-emerald-500/10 rounded-md">
              {success}
            </div>
          )}

          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-400">
              E-mail {editingEmail && <span className="text-sky-400 normal-case">(edytujesz)</span>}
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
              {editingUsername && <span className="text-sky-400 normal-case">(edytujesz)</span>}
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
            <label className="text-xs uppercase text-zinc-400">Rola</label>
            <div className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-400 text-sm">
              {role}
            </div>
          </div>

          {/* TWOJE REZERWACJE*/}
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-400">Zarządzanie treningami</label>
            <Link
              to="/my-reservations"
              className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-sky-500 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-white font-medium">Moje rezerwacje</p>
                <p className="text-zinc-400 text-xs">Podgląd i anulowanie Twoich treningów</p>
              </div>
              <span className="text-sky-400 text-xs">Przejdź</span>
            </Link>
          </div>

          {/* SIŁOWNIA */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-400">Wybrana siłownia</label>
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
                <span className="text-zinc-400 text-sm">+ Wybierz siłownię</span>
              </Link>
            )}
          </div>

          {role === "GYM_MANAGER" && (
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400">Zaproszenia dla trenerów</label>
              <Link
                to="/gym/invites/trainers"
                className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-sky-500 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-white font-medium">Stwórz link zaproszenia dla trenera</p>
                  <p className="text-zinc-400 text-xs">Generuj i zarządzaj aktywnymi linkami</p>
                </div>
                <span className="text-sky-400 text-xs">Przejdź</span>
              </Link>
            </div>
          )}

          {/* SEKCJA TRENERA */}
          {role === "TRAINER" && (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Twój Profil Trenera
              </h3>

              {/* ZDJĘCIE PROFILOWE */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">URL Zdjęcia profilowego</label>
                <Input
                  placeholder="https://..."
                  className="w-full border-zinc-700 bg-zinc-950 text-zinc-400"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                />
              </div>

              {/* DOSTĘPNOŚĆ */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">Twoje godziny pracy</label>
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

              {/* BIO */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">Opis (Bio)</label>
                <textarea
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-400 text-sm min-h-[100px] outline-none focus:border-zinc-600 transition-colors"
                  placeholder="Napisz kilka słów o sobie..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {/* TAGI */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">
                  Tagi (oddzielone przecinkiem)
                </label>
                <Input
                  placeholder="np. joga, crossfit, trójbój siłowy"
                  className="w-full border-zinc-700 bg-zinc-950 text-zinc-400"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {/* SOCIAL MEDIA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs uppercase text-zinc-400">Facebook</label>
                  <Input
                    placeholder="URL profilu"
                    className="border-zinc-700 bg-zinc-950 text-zinc-400"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-zinc-400">Instagram</label>
                  <Input
                    placeholder="URL profilu"
                    className="border-zinc-700 bg-zinc-950 text-zinc-400"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-zinc-400">Discord</label>
                  <Input
                    placeholder="Nazwa użytkownika"
                    className="border-zinc-700 bg-zinc-950 text-zinc-400"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase text-zinc-400">Zmień hasło</label>
            <Button
              variant="outline"
              type="button"
              onClick={handlePasswordResetRequest}
              disabled={resetLoading}
              className="w-full justify-start bg-zinc-950 border-zinc-700 hover:border-sky-500 text-zinc-300 h-auto p-3 rounded-xl transition-colors"
            >
              <div className="text-left">
                <p className="text-zinc-400 text-xs">
                  {resetLoading
                    ? "Wysyłanie..."
                    : "Link do zmiany hasła zostanie wysłany na Twój e-mail"}
                </p>
              </div>
            </Button>
          </div>

          <div className="flex gap-2 mt-2">
            <Button onClick={handleSave} className="w-1/2 cursor-pointer">
              Zapisz
            </Button>
            <Button variant="outline" onClick={logout} className="w-1/2 cursor-pointer">
              Wyloguj
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
