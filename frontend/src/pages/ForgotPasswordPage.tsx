import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../api/authService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Proszę podać adres e-mail.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestPasswordReset(email);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Instrukcje resetowania hasła zostały wysłane na Twój e-mail.");
        setEmail("");
      }
    } catch (err) {
      setError("Wystąpił błąd. Spróbuj ponownie później.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[80vh] py-10">
      <Card className="w-[400px] bg-black border border-zinc-800 rounded-[2.5rem] shadow-2xl">
        <CardHeader className="text-center pt-10 pb-6">
          <CardTitle className="text-2xl font-bold text-white">Resetuj hasło</CardTitle>
          <CardDescription className="text-zinc-500 px-4">
            Wpisz e-mail, na który wyślemy link do zmiany hasła.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
                {success}
              </div>
            )}

            <Input
              type="email"
              placeholder="Twój e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-800 h-12 rounded-xl text-white"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 h-12 rounded-full font-bold shadow-lg shadow-sky-500/20"
            >
              {loading ? "Wysyłanie..." : "Wyślij link"}
            </Button>

            <div className="text-center pt-2">
              <Link to="/auth" className="text-sm text-zinc-500 hover:text-white transition-colors">
                Wróć do logowania
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
