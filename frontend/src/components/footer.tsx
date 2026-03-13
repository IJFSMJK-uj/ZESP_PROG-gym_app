import { useAuth } from '../context/AuthContext';

export const Footer = () => {
  const { userEmail, logout } = useAuth();

  return (
    <footer style={{ padding: '20px', background: '#222', color: 'white', position: 'fixed', bottom: 0, width: '100%' }}>
      {userEmail ? (
        <p>
          Jesteś zalogowany jako: <strong>{userEmail}</strong> | 
          <button onClick={logout} style={{ marginLeft: '10px' }}>Wyloguj</button>
        </p>
      ) : (
        <p>Nie jesteś zalogowany</p>
      )}
    </footer>
  );
};