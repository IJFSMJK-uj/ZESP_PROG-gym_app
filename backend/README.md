* Node.js + Express + Prisma + PostgreSQL
* DB in Neon

Uruchamianie:
    1. W folderze /backend wywołaj: npm install
    2. Stwórz lub edytuj plik /backend/.env
    3. Dodaj do niego stałe DATABASE_URL, DATABASE_URL_UNPOOLED, JWT_SECRET
    4. npx prisma generate
    5. npx prisma migrate dev