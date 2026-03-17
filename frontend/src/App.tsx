import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/navbar';
import { Footer } from './components/footer';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
// import { TrainersPage } from './pages/TrainersPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-black text-zinc-50 flex flex-col font-sans selection:bg-sky-500/30">
          <Navbar />
          
          <main className="flex-grow flex flex-col pt-8 pb-24">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              {/* <Route path="/trainers" element={<TrainersPage />} /> */}
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;