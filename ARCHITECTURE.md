# 🏛️ Architektura Bazy Danych v2

Głównym celem zmiany schematu bazy danych było wyeliminowanie długu technologicznego, zwiększenie bezpieczeństwa typów w TypeScripcie i rozwiązanie problemów z relacjami, które blokowały/utrudniały dodawanie nowych funkcji.

## 🚨 Co było nie tak w poprzedniej wersji?

1. **God Object (`User`):** Tabela użytkownika przechowywała wszystko. Zwykły klient miał puste pola przygotowane dla trenera.
2. **Konflikt logiczny `gymId`:** W starym schemacie pole `gymId` znaczyło dla klienta "moja siłownia", dla menadżera "moja firma", a dla trenera tworzyło chaos, bo trener może pracować w wielu siłowniach naraz.
3. **Luźne rezerwacje:** Klienci mogli zarezerwować trening u kogoś, kto nie był trenerem, albo zarezerwować trenera bez wskazania, na jakiej siłowni odbywa się trening.

---

## 🛠️ Najważniejsze zmiany

#### [Zobacz diagram relacji bazy danych](dbschema.png)

### 1. Rozbicie ról na dedykowane Profile

Tabela `User` służy teraz wyłącznie do logowania (email, hasło, rola). Cała reszta danych została przeniesiona do odpowiednich profili (relacja 1-do-1):

- **`MemberProfile`:** Profil zwykłego klienta. Tutaj znajduje się jego domyślna siłownia (`homeGymId`).
- **`TrainerProfile`:** Profil trenera. Tutaj trzymamy jego `bio`, numer telefonu i w przyszłości np. stawki godzinowe czy linki do sociali.
- **`Role.GYM_MANAGER`:** Właściciele siłowni mają własną, bezpieczną rolę i zarządzają placówkami przez tablicę `managedGyms` (relacja Wiele-do-Wielu).

### 2. Zatrudnienie Trenera (`TrainerAssignment`)

Trener i Siłownia to dwa osobne byty. Łączy je tabela `TrainerAssignment` (Umowa/Zatrudnienie).

- Trener może pracować w wielu siłowniach.
- **Dyspozycyjność (`TrainerAvailability`)** jest teraz podpięta pod **konkretne zatrudnienie**, a nie pod samego trenera. Jeśli zwolnimy trenera z siłowni A, zniknie jego grafik tylko dla siłowni A, a grafik w siłowni B się nie zmieni.

### 3. Rezerwacje (`TrainerReservation`)

Rezerwacje dotyczą `TrainerAssignment` tj. konkretnego zatrudnienia (Siłownia+Trener).

- **Zysk dla DX:** Baza danych zabrania stworzenia rezerwacji bez podania konkretnej siłowni i zweryfikowanego trenera.
- Zamiast nieczytelnych booleanów (`cancelledByUser`), pole `cancelledById`. Zawsze wiemy dokładnie, który użytkownik (klient, trener czy admin) anulował dany trening (pełen audyt).

### 4. Audyt Zaproszeń (`GymInviteTrainer`)

Do systemu generowania linków dodaliśmy śledzenie:

- `createdBy`: Odpowiada na pytanie: Który menadżer wygenerował zaproszenie?
- `usedById`: Odpowiada na pytanie: Kto użył linka i został trenerem?

---

## 💻 Jak to wpływa na projekt?

Poprzednie Story Pointsy wymagają poprawek - dostosowania do nowego schematu bazy danych.

Kiedy piszecie nowe endpointy, pamiętajcie, że `User` nie ma już szczegółowych danych. Aby pobrać np. imię i nazwisko trenera, musicie użyć `include` (i tym samym zbudować drzewo relacji):

```typescript
// Przykład poprawnego zapytania o dane trenera:
const myTrainer = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    trainerProfile: {
      include: {
        assignments: {
          include: { gym: true },
        },
      },
    },
  },
});
```
