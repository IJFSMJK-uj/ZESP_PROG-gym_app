import { Card, CardContent, CardHeader } from "../components/ui/card";

export const TermsPage = () => {
  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4 md:p-8">
      <Card className="w-full max-w-4xl bg-black border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="pt-10 pb-6 text-center">
          <h1 className="text-3xl font-black text-white tracking-tighter">Regulamin Serwisu</h1>
        </CardHeader>
        <CardContent className="px-6 md:px-12 pb-16 space-y-4 text-zinc-400 text-sm leading-relaxed">
          <div className="space-y-6 text-zinc-400 text-sm leading-relaxed text-left">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                1. Postanowienia ogólne
              </h2>
              <p>
                Niniejszy regulamin określa zasady świadczenia usług drogą elektroniczną przez
                aplikację <strong>GymApp</strong>. Korzystanie z serwisu oznacza akceptację
                poniższych warunków. Serwis służy do łączenia klientów z trenerami personalnymi oraz
                zarządzania grafikami rezerwacji na wybranych siłowniach.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                2. Konta Użytkowników
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  W aplikacji występują trzy główne typy ról: <strong>Klient (Member)</strong>,{" "}
                  <strong>Trener (Trainer)</strong> oraz{" "}
                  <strong>Manager Siłowni (Gym Manager)</strong>.
                </li>
                <li>
                  Użytkownik zobowiązany jest do podania prawdziwych danych (np. adres e-mail)
                  podczas rejestracji oraz ochrony swojego hasła.
                </li>
                <li>
                  Jeden użytkownik może posiadać tylko jedno konto powiązane z danym adresem e-mail.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                3. Rezerwacje i Odwoływanie Treningów
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Klienci mają możliwość rezerwacji dostępnych terminów w grafiku wybranych trenerów
                  na przypisanych im siłowniach.
                </li>
                <li>
                  Rezerwacja uzyskuje status <strong>ZATWIERDZONEJ (CONFIRMED)</strong> natychmiast
                  po jej dokonaniu w systemie.
                </li>
                <li>
                  Zarówno Klient, jak i Trener mają prawo anulować rezerwację (status CANCELLED) z
                  poziomu swojego panelu. Prosimy o anulowanie z odpowiednim wyprzedzeniem.
                </li>
                <li>
                  Treningi, których czas rozpoczęcia minął, automatycznie otrzymują status{" "}
                  <strong>ODBYTYCH (DONE)</strong>.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                4. Prawa i Obowiązki
              </h2>
              <p>
                Zabrania się wykorzystywania aplikacji do celów niezgodnych z prawem, przesyłania
                treści obraźliwych oraz działań mogących zakłócić poprawne działanie systemu.
                Trenerzy są odpowiedzialni za rzetelne prowadzenie swoich grafików i dostępności
                (availabilities).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                5. Postanowienia Końcowe
              </h2>
              <p>
                Administrator zastrzega sobie prawo do wprowadzania zmian w Regulaminie. O wszelkich
                istotnych zmianach użytkownicy będą informowani drogą mailową lub poprzez komunikaty
                w aplikacji. W sprawach nieuregulowanych mają zastosowanie przepisy powszechnie
                obowiązującego prawa.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
