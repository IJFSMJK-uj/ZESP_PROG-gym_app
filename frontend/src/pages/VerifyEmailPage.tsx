import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      {status === "loading" && <p className="text-white">Weryfikacja...</p>}
      {status === "success" && (
        <div className="text-center">
          <p className="text-emerald-400 text-xl mb-4">Adres email potwierdzony!</p>
          <button onClick={() => navigate("/auth")} className="text-sky-400 hover:text-sky-300">
            Przejdź do logowania
          </button>
        </div>
      )}
      {status === "error" && (
        <div className="text-center">
          <p className="text-blue-400 text-xl mb-4">Adres email został już potwierdzony.</p>
          <button onClick={() => navigate("/auth")} className="text-sky-400 hover:text-sky-300">
            Przejdź do logowania
          </button>
        </div>
      )}
    </div>
  );
};
