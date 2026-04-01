import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (type: "login" | "register") => {
    setError("");
    try {
      const res =
        type === "login"
          ? await authService.login(email, password)
          : await authService.register(email, password);

      if (type === "login") {
        if (res.token && res.user) {
          login(res.token, res.user);
          navigate("/");
        } else {
          setError(res.error || "Nieprawidłowe dane logowania");
        }
      } else if (type === "register") {
        if (res.userId) {
          const loginRes = await authService.login(email, password);
          if (loginRes.token && loginRes.user) {
            login(loginRes.token, loginRes.user);
            navigate("/");
          } else {
            setError(loginRes.error || "Błąd logowania po rejestracji");
          }
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
    // Główny kontener - upewnij się, że ma min-h-screen i flex-col
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
            {/* Przełącznik TabsList - wymuszamy, by był nad formularzem */}
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

            {/* FORMULARZ - upewniamy się, że każdy TabsContent ma swój flow */}
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
                <Button
                  onClick={() => handleAuth("register")}
                  className="w-full bg-white hover:bg-zinc-200 text-black h-12 rounded-full font-bold"
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
