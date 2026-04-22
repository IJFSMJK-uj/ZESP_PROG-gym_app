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
