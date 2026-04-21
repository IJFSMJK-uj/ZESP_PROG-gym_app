import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import gymsRoutes from "./routes/gyms";
import inviteRoutes from "./routes/invite";
import trainersRoutes from "./routes/trainers";
import trainerAvailabilityRoutes from "./routes/trainerAvailability";
import trainerScheduleRoutes from "./routes/trainerSchedule";
import adminRoutes from "./routes/admin";

const app = express();
const BACKEND_PORT = 5174;

// MIDDLEWARE
app.use(cors()); // frontend - backend connection
app.use(express.json()); // json parse

// ROUTES
app.get("/", (req, res) => {
  res.send("Backend działa!");
});

// MOUNT
app.use("/api/auth", authRoutes);
app.use("/api/gyms", gymsRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api/trainers", trainersRoutes);
app.use("/api/trainer-availability", trainerAvailabilityRoutes);
app.use("/api/trainer-schedule", trainerScheduleRoutes);
app.use("/api/admin", adminRoutes);

// START SERWERA
app.listen(BACKEND_PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`.    server http://localhost:${BACKEND_PORT}`);
  console.log(`-----------------------------------------`);
});
