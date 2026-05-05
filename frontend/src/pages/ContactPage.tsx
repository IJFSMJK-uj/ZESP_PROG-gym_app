import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export const ContactPage = () => {
  const [form, setForm] = useState({
    gymName: "",
    address: "",
    avgClients: "",
    avgTrainers: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = encodeURIComponent(`Zapytanie o współpracę – ${form.gymName}`);
    const body = encodeURIComponent(
      `Nazwa siłowni: ${form.gymName}\n` +
        `Adres: ${form.address}\n` +
        `Średnia liczba klientów: ${form.avgClients}\n` +
        `Średnia liczba trenerów: ${form.avgTrainers}\n\n` +
        `Wiadomość:\n${form.message}`
    );

    window.location.href = `mailto:kontakt@gymapp.pl?subject=${subject}&body=${body}`;
  };

  const features = [
    {
      icon: "📈",
      title: "Więcej rezerwacji",
      desc: "Twoi klienci rezerwują sesje treningowe online 24/7 — bez telefonów, bez papierowych grafików.",
    },
    {
      icon: "🗓️",
      title: "Zarządzanie grafikami",
      desc: "Trenerzy samodzielnie ustawiają dostępność, a system eliminuje konflikty i podwójne rezerwacje.",
    },
    {
      icon: "👥",
      title: "Baza klientów",
      desc: "Pełna historia rezerwacji, profile członków i statystyki — wszystko w jednym panelu.",
    },
    {
      icon: "🔗",
      title: "Onboarding trenerów",
      desc: "Zaproś trenera jednym linkiem. Konto aktywne w minutę, bez zbędnej biurokracji.",
    },
    {
      icon: "📊",
      title: "Analityka obłożenia",
      desc: "Sprawdzaj które godziny są najpopularniejsze i optymalizuj grafik swojej siłowni.",
    },
    {
      icon: "🔒",
      title: "Bezpieczeństwo danych",
      desc: "Dane Twoich klientów są szyfrowane i przechowywane zgodnie z wymogami RODO.",
    },
  ];

  const stats = [
    { value: "120+", label: "Siłowni partnerskich" },
    { value: "15 000+", label: "Aktywnych użytkowników" },
    { value: "98%", label: "Zadowolonych partnerów" },
    { value: "4.9 / 5", label: "Ocena w ankietach" },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.12)_0%,_transparent_70%)] pointer-events-none" />
        <div className="relative max-w-4xl space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm font-semibold tracking-widest uppercase mb-2">
            Dla właścicieli siłowni
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Twoja siłownia zasługuje na{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
              nowoczesne narzędzia
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Dołącz do GYMAPP i daj swoim klientom możliwość rezerwacji treningów online. Więcej
            organizacji, więcej rezerwacji, mniej chaosu.
          </p>
          <div className="pt-4">
            <a href="#contact-form">
              <Button
                size="lg"
                className="rounded-full bg-sky-500 hover:bg-sky-400 text-white px-10 py-6 text-lg shadow-[0_0_30px_rgba(14,165,233,0.4)] transition-all"
              >
                Skontaktuj się z nami
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 bg-zinc-900/50 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-sky-400">{s.value}</div>
              <div className="mt-1 text-sm text-zinc-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Dlaczego siłownie wybierają GYMAPP?
            </h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
              Jeden system. Wszystkie narzędzia potrzebne do sprawnego zarządzania obiektem fitness.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-sky-500/40 hover:bg-zinc-900 transition-all"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Quote */}
      <section className="py-16 px-6 border-y border-zinc-800 bg-zinc-900/40">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="text-5xl text-sky-400">"</div>
          <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
            Od kiedy korzystamy z GYMAPP, liczba rezerwacji wzrosła o 40%. Klienci chwalą sobie
            wygodę, a trenerzy mają wreszcie porządek w grafikach.
          </p>
          <div className="text-zinc-500 text-sm">— Marta K., właścicielka FitZone Kraków</div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Jak wygląda wdrożenie?
            </h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-0 relative">
            {[
              {
                step: "01",
                title: "Kontakt",
                desc: "Wypełnij formularz poniżej. Nasz zespół odezwie się w ciągu 24 godzin.",
              },
              {
                step: "02",
                title: "Demo & umowa",
                desc: "Pokażemy Ci system na żywo i wspólnie ustalimy warunki współpracy.",
              },
              {
                step: "03",
                title: "Onboarding",
                desc: "Konfigurujemy Twój obiekt i pomagamy zaprosić trenerów do platformy.",
              },
              {
                step: "04",
                title: "Gotowe!",
                desc: "Twoi klienci zaczynają rezerwować treningi online. Zero papieru.",
              },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex-1 flex flex-col md:flex-row items-start">
                <div className="flex flex-col items-center md:items-start flex-1 px-4 md:px-6">
                  <div className="text-sky-400 font-extrabold text-sm tracking-widest mb-2">
                    {item.step}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden md:flex items-start pt-1 text-zinc-700 text-2xl px-2 select-none">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section
        id="contact-form"
        className="py-24 px-6 border-t border-zinc-800 bg-zinc-900/40 scroll-mt-20"
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Skontaktuj się z nami
            </h2>
            <p className="mt-3 text-zinc-400">
              Wypełnij formularz, a my skontaktujemy się z Tobą, aby omówić szczegóły współpracy.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
          >
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">
                  Nazwa siłowni <span className="text-sky-400">*</span>
                </label>
                <Input
                  name="gymName"
                  value={form.gymName}
                  onChange={handleChange}
                  placeholder="np. FitZone Kraków"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">
                  Adres <span className="text-sky-400">*</span>
                </label>
                <Input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="ul. Przykładowa 1, Kraków"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">
                  Średnia liczba klientów / miesiąc <span className="text-sky-400">*</span>
                </label>
                <Input
                  name="avgClients"
                  value={form.avgClients}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  placeholder="np. 250"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">
                  Liczba trenerów <span className="text-sky-400">*</span>
                </label>
                <Input
                  name="avgTrainers"
                  value={form.avgTrainers}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  placeholder="np. 8"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-sky-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Wiadomość</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Opowiedz nam więcej o swojej siłowni lub zadaj pytanie..."
                rows={5}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full bg-sky-500 hover:bg-sky-400 text-white py-6 text-base font-semibold shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all"
            >
              Nawiąż kontakt →
            </Button>

            <p className="text-center text-xs text-zinc-500">
              Kliknięcie otworzy Twój klient poczty z gotową wiadomością.
              <br />
              Dane nie są przechowywane na naszych serwerach.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};
