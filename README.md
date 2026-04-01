# GYMAPP

### ⚡ Szybki start

#### 🛠️ Wymagania uruchomieniowe

- **Node.js**
- **Docker**

**Przed pierwszym uruchomieniem** pobierz plik [.env](https://github.com/IJFSMJK-uj/gym-app-private/blob/main/.env) i wrzuć go do folderu /backend

Uruchomienie całego projektu (Frontend, Backend, Baza Danych)

1. **Instalacja zależności:**
   `npm run install-all`
2. **Uruchomienie i seeding bazy danych:**
   `npm run db:setup`
3. **Uruchomienie serwerów lokalnych:**
   `npm run dev`
4. **Aplikacja będzie dostępna pod**:
   `http://localhost:5173`

> **Uwaga:** Po uruchomieniu aplikacji możesz zalogować się na gotowe konta testowe.

> Wszystkie konta mają przypisane domyśle hasło: `password`.

> Listę kont (adresów mailowych do logowania) można sprawdzić w pliku /backend/prisma/seed.ts lub poprzez Prisma Studio (skrypt `npm run db:studio` w sekcji poniżej)

---

### 🧰 Jak pracować? (Katalog dostępnych skryptów)

Zarządzanie całym środowiskiem odbywa się z poziomu folderu głównego.

| Komenda               | Opis działania                                                                                                                                   |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`         | Uruchamia jednocześnie frontend (React) i backend (Express)                                                                                      |
| `npm run install-all` | Instaluje paczki npm                                                                                                                             |
| `npm run db:setup`    | Uruchamia kontener PostgreSQL, tworzy strukturę tabel i wstrzykuje dane testowe. Użyj po zrobieniu `git pull`                                    |
| `npm run db:migrate`  | Tworzy historię migracji. **MUSISZ** jej użyć przed zacommitowaniem, jeżeli zmieniłeś/aś schemat bazy danych (zmieniłeś/aś plik `schema.prisma`) |
| `npm run db:stop`     | Zatrzymuje i bezpiecznie wyłącza kontener Dockera z bazą danych. Użyj, gdy kończysz pracę i chcesz wyłączyć Dockera                              |
| `npm run db:reset`    | Czyści bazę danych, nakłada schemat od nowa i ponownie wstrzykuje dane testowe. Używaj, gdy popsujesz coś w danych                               |
| `npm run db:studio`   | Uruchamia lokalny serwer i otwiera w przeglądarce GUI do zarządzania danymi (Prisma Studio)                                                      |
| `npm run format`      | Formatuje wszystkie obsługiwane (przez Prettier) pliki w repozytorium.                                                                           |

#### ⚠️ Złote zasady:

- Zmieniasz `schema.prisma` ➡️ Wpisujesz `npm run db:migrate` i commitujesz wygenerowany folder `/backend/prisma/migrations/`.
- Pobierasz kod z GitHuba i aplikacja nie działa? ➡️ Wpisujesz `npm run db:setup`.

---

### 💾 Baza Danych i Seeding

#### [Zobacz dokumentację i opis zmian bazy danych](ARCHITECTURE.md)

#### [Zobacz diagram relacji bazy danych](dbschema.png). Diagram stworzono przy pomocy: **https://prisma-editor.bahumaish.com/**

Korzystamy z PostgreSQL wewnątrz Dockera.

- **Przeglądanie bazy:** Użyj wbudowanego interfejsu Prismy (prisma studio). Użyj skryptu `npm run db:studio`.
- **Dane testowe:** Plik `backend/prisma/seed.ts` zawiera skrypt, który generuje dane testowe dla aplikacji. Jest idempotentny.

---

### 🧹 Code Quality (Prettier & Husky)

- **Prettier & Prisma Plugin:** Główne narzędzie formatujące.
- **Husky & lint-staged:** Przy próbie wykonania `git commit`, Husky przechwytuje akcję i w locie formatuje pliki.

---
