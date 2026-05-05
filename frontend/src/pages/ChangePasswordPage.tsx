import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export const ChangePasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Nieprawidłowy token");
      return;
    }

    if (password.length < 6) {
      setError("Hasło musi mieć minimum 6 znaków");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    setLoading(true);
    const result = await authService.changePassword(token, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/auth"), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md bg-black border border-zinc-800 rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle>Nowe hasło</CardTitle>
          <CardDescription>Wprowadź swoje nowe hasło poniżej</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-sm text-emerald-300 p-4 bg-emerald-500/10 rounded-md text-center">
              Hasło zostało zmienione! Za chwilę zostaniesz przekierowany do logowania...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-red-300 p-2 bg-red-500/10 rounded-md border border-red-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">Nowe hasło</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 focus:border-sky-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">Powtórz nowe hasło</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 focus:border-sky-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2 cursor-pointer" disabled={loading}>
                {loading ? "Zmieniam..." : "Zapisz nowe hasło"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
