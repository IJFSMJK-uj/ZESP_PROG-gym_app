import { useState } from 'react';
import { authService } from '../api/authService';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await authService.login(email, password);

    try {
      if (isLogin) {
        const res = await authService.login(email, password);
        if (res.token) {
          login(res.token, email); 
          alert("Zalogowano!");
        } else {
          alert(res.error);
        }
      } else {
        const res = await authService.register(email, password);
        if (res.userId) alert("Zarejestrowano! Teraz się zaloguj.");
        else alert(res.error);
      }
    } catch (err) {
      alert("Błąd połączenia z serwerem");
    }
  };

  return (
    <div className="auth-container">
      <h1>{isLogin ? 'Logowanie' : 'Rejestracja'}</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="e-mail" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">{isLogin ? 'Zaloguj' : 'Zarejestruj'}</button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz konto? Zaloguj się'}
      </button>
    </div>
  );
};