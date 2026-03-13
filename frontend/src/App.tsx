import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage.tsx';
import TrainersPage from './pages/TrainersPage.tsx';
import AuthPage from './pages/AuthPage.tsx';
import { Button } from '@/components/ui/button';
import { Footer } from './components/footer';
import { AuthProvider } from './context/AuthContext';

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<nav>
					<Button variant="default" asChild>
						<Link to="/">Strona główna</Link>
					</Button>
					<Button variant="default" asChild>
						<Link to="/trainers">Trenerzy</Link>
					</Button>
					<Button variant="default" asChild>
						<Link to="/auth">Zaloguj/Zarejestruj</Link>
					</Button>
				</nav>
				<main>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/trainers" element={<TrainersPage />} />
						<Route path="/auth" element={<AuthPage />} />
					</Routes>
					<Footer />
				</main>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App
