import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

type Status = "loading" | "success" | "expired" | "invalid";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      return;
    }

    fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
        } else {
          const msg = data.error || "";
          setErrorMessage(msg);
          if (msg.includes("wygasł")) {
            setStatus("expired");
          } else {
            setStatus("invalid");
          }
        }
      })
      .catch(() => setStatus("invalid"));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      {status === "loading" && <p className="text-white">Weryfikacja...</p>}

      {status === "success" && (
        <div className="text-center">
          <p className="text-emerald-400 text-xl mb-4">Adres email potwierdzony.</p>
          <button onClick={() => navigate("/auth")} className="text-sky-400 hover:text-sky-300">
            Przejdź do logowania
          </button>
        </div>
      )}

      {status === "expired" && (
        <div className="text-center">
          <p className="text-yellow-400 text-xl mb-2">Link weryfikacyjny wygasł.</p>
          <p className="text-zinc-400 text-sm mb-6">
            Zaloguj się na stronie logowania aby wysłać nowy link.
          </p>
          <button onClick={() => navigate("/auth")} className="text-sky-400 hover:text-sky-300">
            Przejdź do logowania
          </button>
        </div>
      )}

      {status === "invalid" && (
        <div className="text-center">
          <p className="text-red-400 text-xl mb-2">Link jest nieprawidłowy lub już został użyty.</p>
          <p className="text-zinc-400 text-sm mb-6">
            Jeśli Twoje konto nie jest jeszcze aktywne, zaloguj się aby wysłać nowy link.
          </p>
          <button onClick={() => navigate("/auth")} className="text-sky-400 hover:text-sky-300">
            Przejdź do logowania
          </button>
        </div>
      )}
    </div>
  );
};
