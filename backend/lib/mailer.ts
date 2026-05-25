import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verifyUrl = `http://localhost:5173/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"GymApp" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Potwierdź swój adres email",
    html: `
      <div style="font-family: sans-serif; margin: auto;">
        <h2>Witaj w GymApp!</h2>
        <p>Kliknij poniższy link aby potwierdzić swój adres email:</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #0ea5e9;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
        ">
          Potwierdź email
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 16px;">
          Link wygasa po 24 godzinach.
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const changePassUrl = `http://localhost:5173/change-password?token=${token}`;

  await transporter.sendMail({
    from: `"GymApp" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Zmiana hasła",
    html: `
      <div style="font-family: sans-serif; margin: auto;">
        <h2>Wysłałeś prośbę o zmianę hasła</h2>
        <p>Kliknij poniższy link aby zmienić hasło:</p>
        <a href="${changePassUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #0ea5e9;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
        ">
          Zmień hasło
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 16px;">
          Link wygasa po 1 godzinie.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 16px;">
          Jeśli nie wysyłałeś prośby o zmianę hasła zignoruj tą wiadomość.
        </p>
      </div>
    `,
  });
};

export const sendTrainingReminderEmail = async (
  email: string,
  trainerName: string,
  dateStr: string
) => {
  await transporter.sendMail({
    from: `"GymApp" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Przypomnienie o zbliżającym się treningu!",
    html: `
      <div style="font-family: sans-serif; margin: auto; max-w-md;">
        <h2>Twój trening zbliża się wielkimi krokami! 🏋️‍♂️</h2>
        <p>Przypominamy, że wkrótce masz zaplanowany trening z trenerem: <strong>${trainerName}</strong>.</p>
        <p>Data i godzina rozpoczęcia: <strong>${dateStr}</strong></p>
        <p>Przygotuj strój, weź wodę i do zobaczenia na sali!</p>
        <p style="color: #999; font-size: 12px; margin-top: 16px;">
          Jeśli nie możesz dotrzeć na trening, pamiętaj o anulowaniu rezerwacji w aplikacji.
        </p>
      </div>
    `,
  });
};

export const sendReviewPromptEmail = async (email: string, trainerName: string) => {
  const reviewsUrl = `http://localhost:5173/my-reservations`;

  await transporter.sendMail({
    from: `"GymApp" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Jak minął trening? Zostaw opinię!",
    html: `
      <div style="font-family: sans-serif; margin: auto; max-w-md;">
        <h2>Mamy nadzieję, że twój trening się udał!</h2>
        <p><strong>${trainerName}</strong> ceni sobie Twój feedback. Poświęć 30 sekund i oceń wczorajszy trening.</p>
        <a href="${reviewsUrl}" style="
          display: inline-block;
          padding: 8px 8px;
          background: #0ea5e9;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 10px;
        ">
          Oceń trenera
        </a>
      </div>
    `,
  });
};
