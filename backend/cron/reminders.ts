import cron from "node-cron";
import prisma from "../lib/prisma";
import { sendTrainingReminderEmail, sendReviewPromptEmail } from "../lib/mailer";

cron.schedule("0 * * * *", async () => {
  console.log("[CRON] Checking for notifications to send...");

  const now = new Date();

  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  const inTwoDays = new Date(todayMidnight);
  inTwoDays.setDate(todayMidnight.getDate() + 2);

  try {
    const upcomingReservations = await prisma.trainerReservation.findMany({
      where: {
        status: "CONFIRMED",
        reminderSent: false,
        date: {
          gte: todayMidnight,
          lte: inTwoDays,
        },
      },
      include: {
        user: { select: { email: true } },
        assignment: {
          include: { trainerProfile: true },
        },
      },
    });

    for (const res of upcomingReservations) {
      try {
        const trainingStartTime = new Date(res.date);
        trainingStartTime.setHours(res.startHour, 0, 0, 0);

        const timeDiff = trainingStartTime.getTime() - now.getTime();

        if (timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000) {
          const trainerName = `${res.assignment.trainerProfile.firstName} ${res.assignment.trainerProfile.lastName}`;

          const formattedDate = res.date.toLocaleDateString("pl-PL");
          const startTimeStr = `${res.startHour.toString().padStart(2, "0")}:00`;
          const endTimeStr = `${res.endHour.toString().padStart(2, "0")}:00`;
          const dateStr = `${formattedDate} w godzinach ${startTimeStr} - ${endTimeStr}`;

          await sendTrainingReminderEmail(res.user.email, trainerName, dateStr);

          await prisma.trainerReservation.update({
            where: { id: res.id },
            data: { reminderSent: true },
          });
          console.log(`[CRON] Sent training reminder to ${res.user.email}`);
        }
      } catch (err) {
        console.error(`[CRON] Error sending trainimg reminder for reservation id: ${res.id}:`, err);
      }
    }

    const pastReservations = await prisma.trainerReservation.findMany({
      where: {
        status: "DONE",
        reviewPromptSent: false,
        review: null,
        date: {
          lte: todayMidnight,
        },
      },
      include: {
        user: { select: { email: true } },
        assignment: {
          include: { trainerProfile: true },
        },
      },
    });

    for (const res of pastReservations) {
      try {
        const trainingEndTime = new Date(res.date);
        trainingEndTime.setHours(res.endHour, 0, 0, 0);

        if (trainingEndTime.getTime() < now.getTime()) {
          const trainerName = `${res.assignment.trainerProfile.firstName} ${res.assignment.trainerProfile.lastName}`;

          await sendReviewPromptEmail(res.user.email, trainerName);

          await prisma.trainerReservation.update({
            where: { id: res.id },
            data: { reviewPromptSent: true },
          });
          console.log(`[CRON] Sent review prompt to ${res.user.email}`);
        }
      } catch (err) {
        console.error(`[CRON] Error sending review prompt for reservation id: ${res.id}:`, err);
      }
    }
  } catch (error) {
    console.error("[CRON] Encountered error while processing notifications: ", error);
  }
});

console.log("[CRON] Registered notification service.");
