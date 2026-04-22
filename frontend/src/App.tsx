import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { TrainersPage } from "./pages/TrainersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SelectGymPage } from "./pages/SelectGymPage";
import { GymDetailPage } from "./pages/GymDetailPage";
import { GymInviteTrainerPage } from "./pages/GymInviteTrainerPage";
import { GymCreateTrainerInvitePage } from "./pages/GymCreateTrainerInvitePage";
import TrainerAvailabilityPage from "./pages/TrainerAvailabilityPage";
import { GymAdminPage } from "./pages/GymAdminPage";
import TrainerSchedulePage from "./pages/TrainerSchedulePage";
import { ContactPage } from "./pages/ContactPage";
import { MyReservationsPage } from "./pages/MyReservationsPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { FaqPage } from "./pages/FaqPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-black text-zinc-50 flex flex-col font-sans selection:bg-sky-500/30">
          <Navbar />

          <main className="flex-grow flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/trainers" element={<TrainersPage />} />
              <Route path="/trainer/availability" element={<TrainerAvailabilityPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/gyms" element={<SelectGymPage />} />
              <Route path="/gyms/:gymId" element={<GymDetailPage />} />
              <Route path="/trainer/:assignmentId/schedule" element={<TrainerSchedulePage />} />
              <Route path="/my-reservations" element={<MyReservationsPage />} />
              <Route path="/gym/invites/trainers" element={<GymCreateTrainerInvitePage />} />
              <Route path="/gym/admin" element={<GymAdminPage />} />
              <Route path="/trainer-invite/:hash" element={<GymInviteTrainerPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/tos" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
