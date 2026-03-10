import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage.tsx';
import TrainersPage from './pages/TrainersPage.tsx';
import { Button } from '@/components/ui/button';

function App() {
	return (
		<BrowserRouter>
			<nav>
				<Button variant="default" asChild>
					<Link to="/">Strona główna</Link>
				</Button>
				<Button variant="default" asChild>
					<Link to="/trainers">Trenerzy</Link>
				</Button>
			</nav>
			<main>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/trainers" element={<TrainersPage />} />
				</Routes>
			</main>

		</BrowserRouter>
	);
}

export default App
