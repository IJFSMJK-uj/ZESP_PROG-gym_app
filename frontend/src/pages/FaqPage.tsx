import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

const faqData = [
  {
    question: "Jak rozpocząć korzystanie z Gym App?",
    answer:
      "Wystarczy założyć darmowe konto w zakładce Rejestracja. Po zalogowaniu uzyskasz dostęp do listy siłowni, trenerów i będziesz mógł rozpocząć planowanie swoich treningów.",
  },
  {
    question: "Czy aplikacja jest darmowa?",
    answer:
      "Tak, podstawowe funkcje takie jak rejestracja, przeglądanie trenerów i śledzenie własnych postępów są całkowicie darmowe. Wybrani trenerzy mogą jednak pobierać opłaty za indywidualne plany.",
  },
  {
    question: "Jak mogę skontaktować się z trenerem?",
    answer:
      "Po przejściu do zakładki 'Trenerzy', wybierz profil interesującej Cię osoby. Znajdziesz tam przycisk umożliwiający bezpośredni kontakt lub wykupienie konsultacji.",
  },
  {
    question: "Jak zostać trenerem na platformie Gym App?",
    answer:
      "Proces dołączania dla trenerów odbywa się na podstawie zaproszeń. Specjalny, unikalny link rejestracyjny generuje menadżer siłowni, z którą chcesz współpracować. Poproś go o wygenerowanie dostępu! Jeśli Twojego klubu jeszcze u nas nie ma, zaproponuj im współpracę.",
  },
  {
    question: "Jak moja siłownia może zostać partnerem Gym App?",
    answer:
      "Jesteś właścicielem siłowni? Zawsze chętnie powiększamy naszą sieć! Aby zgłosić swój klub, przejdź do zakładki 'Dla siłowni' i wypełnij znajdujący się tam formularz. Nasz zespół skontaktuje się z Tobą najszybciej jak to możliwe, aby omówić szczegóły i skonfigurować Twoją przestrzeń.",
  },
];

export const FaqPage = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] py-12 px-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Nagłówek strony */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Często zadawane{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
              pytania
            </span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Nie znalazłeś odpowiedzi?{" "}
            <a
              href="mailto:kontakt@gymapp.pl"
              className="text-sky-400 hover:text-sky-300 hover:underline underline-offset-4 transition-all"
            >
              Skontaktuj się z naszym wsparciem.
            </a>
          </p>
        </div>

        {/* Akordeon z pytaniami */}
        <div className="bg-black/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-6 md:p-8 shadow-2xl">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-zinc-800/50 last:border-0"
              >
                <AccordionTrigger className="text-left text-white transition-colors py-4 font-semibold text-md md:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed pb-4 text-sm md:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};
