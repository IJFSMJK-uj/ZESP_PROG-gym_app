import { Card, CardContent, CardHeader } from "../components/ui/card";

export const PrivacyPage = () => {
  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 md:p-8">
      <Card className="w-full max-w-4xl bg-black border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="pt-10 pb-6 text-center">
          <h1 className="text-3xl font-black text-white tracking-tighter">Polityka Prywatności</h1>
        </CardHeader>
        <CardContent className="px-6 md:px-12 pb-16 space-y-4 text-zinc-400 text-sm leading-relaxed">
          <div className="space-y-6 text-zinc-400 text-sm leading-relaxed text-left">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                1. Administrator Danych Osobocych
              </h2>
              <p>
                Administratorem Twoich danych osobowych zbieranych za pośrednictwem aplikacji{" "}
                <strong>GymApp</strong> jest [Nazwa Twojej Firmy / Twoje Imię i Nazwisko], z
                siedzibą w [Miasto]. W sprawach związanych z danymi osobowymi możesz kontaktować się
                pod adresem e-mail: [Twój E-mail].
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                2. Jakie dane przetwarzamy?
              </h2>
              <p>Podczas korzystania z naszej aplikacji zbieramy i przetwarzamy m.in.:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Adres e-mail oraz zaszyfrowane hasło (niezbędne do logowania).</li>
                <li>
                  Imię, nazwisko, numer telefonu i opis (w przypadku uzupełnienia profilu Trenera
                  lub Klienta).
                </li>
                <li>
                  Historię Twoich rezerwacji, statusy treningów oraz informacje o przypisaniu do
                  siłowni.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                3. Cel Przetwarzania
              </h2>
              <p>
                Twoje dane przetwarzane są wyłącznie w celu prawidłowego świadczenia usług serwisu
                (np. łączenia Cię z odpowiednim trenerem, wysyłania powiadomień o treningach) oraz w
                celach technicznych związanych z utrzymaniem konta użytkownika, zgodnie z wymogami
                RODO (GDPR).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                4. Udostępnianie danych
              </h2>
              <p>
                W ramach działania platformy określone dane muszą być współdzielone. Jeśli jesteś
                Klientem, Twój e-mail i imię będą widoczne dla Trenera, do którego się zapisujesz.
                Jeśli jesteś Trenerem, Twój profil (w tym imię i nazwisko) jest widoczny publicznie
                dla zalogowanych Klientów. Nie sprzedajemy Twoich danych podmiotom trzecim.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                5. Pliki Cookies (Ciasteczka)
              </h2>
              <p>
                Aplikacja wykorzystuje pliki cookies (oraz podobne technologie, takie jak Local
                Storage) wyłącznie do celów niezbędnych do działania serwisu – m.in. do utrzymywania
                sesji logowania (tokeny autoryzacyjne) oraz zapamiętania Twojej zgody na politykę
                prywatności.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                6. Twoje Prawa
              </h2>
              <p>
                Masz prawo do wglądu w swoje dane, ich poprawiania, żądania ich usunięcia (prawo do
                bycia zapomnianym) oraz ograniczenia przetwarzania. Aby zrealizować te prawa,
                skontaktuj się z administratorem systemu.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
