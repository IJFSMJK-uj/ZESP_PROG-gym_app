import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../api/authService";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [success, setSuccess] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (type: "login" | "register") => {
    setError("");
    setSuccess("");

    if (type === "register" && !acceptedTerms) {
      setError("Musisz zaakceptować regulamin, aby stworzyć konto.");
      return;
    }

    try {
      const res =
        type === "login"
          ? await authService.login(email, password)
          : await authService.register(email, password);

      if (type === "login") {
        if (res.token && res.user) {
          login(res.token, res.user);
          navigate("/");
        } else if (res.error?.includes("Potwierdź")) {
          setError(res.error);
        } else {
          setError(res.error || "Nieprawidłowe dane logowania");
        }
      } else if (type === "register") {
        if (res.userId) {
          setSuccess("Konto utworzone! Sprawdź skrzynkę email i kliknij link aktywacyjny.");
          setEmail("");
          setPassword("");
        } else {
          setError(res.error || "Błąd rejestracji");
        }
      }
    } catch (err) {
      console.error("Błąd sieci:", err);
      setError("Problem z połączeniem");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[80vh] py-10">
      <Card className="w-[400px] bg-black border border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <Tabs defaultValue="login" className="flex flex-col w-full">
          <CardHeader className="flex flex-col space-y-2 text-center pt-10 pb-6 px-8">
            <CardTitle className="text-3xl font-extrabold text-white tracking-tight">
              GYMAPP
            </CardTitle>
            <CardDescription className="text-zinc-500 text-sm">
              Zaloguj się lub stwórz konto
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col px-8 pb-10">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 rounded-full p-1 mb-8 border border-zinc-800">
              <TabsTrigger
                value="login"
                className="rounded-full py-2 data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-all"
              >
                Logowanie
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-full py-2 data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-all"
              >
                Rejestracja
              </TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
                {success}
              </div>
            )}

            <TabsContent value="login" className="m-0 focus-visible:ring-0">
              <div className="flex flex-col space-y-4">
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 h-12 rounded-xl text-white"
                />
                <Input
                  type="password"
                  placeholder="Hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 h-12 rounded-xl text-white"
                />
                <Button
                  onClick={() => handleAuth("login")}
                  className="w-full bg-sky-500 hover:bg-sky-400 h-12 rounded-full font-bold shadow-lg shadow-sky-500/20"
                >
                  Zaloguj się
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="register" className="m-0 focus-visible:ring-0">
              <div className="flex flex-col space-y-4">
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 h-12 rounded-xl text-white"
                />
                <Input
                  type="password"
                  placeholder="Stwórz hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 h-12 rounded-xl text-white"
                />
                <div className="flex items-start space-x-3 py-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-zinc-900 cursor-pointer"
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs text-zinc-400 leading-tight cursor-pointer"
                  >
                    Zapoznałem/am się i akceptuję{" "}
                    <Link to="/tos" target="_blank" className="text-sky-400 hover:underline">
                      Regulamin serwisu
                    </Link>{" "}
                    oraz{" "}
                    <Link to="/privacy" target="_blank" className="text-sky-400 hover:underline">
                      Politykę prywatności
                    </Link>
                    .
                  </label>
                </div>

                <Button
                  onClick={() => handleAuth("register")}
                  className={`w-full h-12 rounded-full font-bold transition-all ${
                    acceptedTerms
                      ? "bg-white hover:bg-zinc-200 text-black cursor-pointer"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
                  }`}
                  disabled={!acceptedTerms}
                >
                  Stwórz konto
                </Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};
