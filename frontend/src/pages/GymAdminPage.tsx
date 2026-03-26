import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { gymsService } from '../api/gymsService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const GymAdminPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [role, setRole] = useState('');
  const [gymName, setGymName] = useState('');
  const [address, setAddress] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (profile.error) {
          setError(profile.error);
          setLoading(false);
          return;
        }

        setRole(profile.role || '');

        if (profile.role !== 'GYM') {
          setLoading(false);
          return;
        }

        if (!profile.gym) {
          setError('Konto siłowni nie jest powiązane z żadną siłownią.');
          setLoading(false);
          return;
        }

        const gym = await gymsService.getGymById(profile.gym.id);
        if (gym.error) {
          setError(gym.error);
          setLoading(false);
          return;
        }

        setGymName(gym.name || '');
        setAddress(gym.address || '');
        setOpenTime(gym.openTime || '');
        setCloseTime(gym.closeTime || '');
      } catch {
        setError('Nie udało się pobrać danych siłowni');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const data = await gymsService.updateMyGym({ address, openTime, closeTime });

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Dane siłowni zostały zaktualizowane pomyślnie.');
      }
    } catch {
      setError('Błąd sieci. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-white mb-4">Musisz się zalogować, aby zarządzać siłownią.</p>
        <Button variant="outline" onClick={() => navigate('/auth')} className="cursor-pointer">
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white">Ładowanie danych siłowni...</p>
      </div>
    );
  }

  if (role !== 'GYM') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-red-400 mb-4 text-center">
          Tylko konto siłowni ma dostęp do tej strony.
        </p>
        <Button variant="outline" onClick={() => navigate('/')} className="cursor-pointer">
          Powrót
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 flex justify-center">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* HEADER CARD */}
        <Card className="bg-black border border-zinc-800 rounded-3xl">
          <CardHeader>
            <CardTitle>Ustawienia siłowni</CardTitle>
            <CardDescription>
              Zarządzaj godzinami otwarcia i lokalizacją siłowni{gymName ? `: ${gymName}` : ''}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {error && (
              <div className="text-sm text-red-300 p-3 bg-red-500/10 rounded-xl">{error}</div>
            )}
            {success && (
              <div className="text-sm text-emerald-300 p-3 bg-emerald-500/10 rounded-xl">{success}</div>
            )}

            {/* ADRES */}
            <div className="space-y-2">
              <label className="text-xs uppercase text-zinc-400">Adres</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="np. ul. Sportowa 1, Warszawa"
                className="w-full border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-sky-500 transition-colors"
              />
            </div>

            {/* GODZINY */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">Godzina otwarcia</label>
                <Input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-sky-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-zinc-400">Godzina zamknięcia</label>
                <Input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* PODGLĄD */}
            {(openTime || closeTime) && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
                <span className="text-zinc-300 font-medium">Aktualny plan: </span>
                {openTime || '--:--'} – {closeTime || '--:--'}
              </div>
            )}

            {/* ZAPISZ */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 cursor-pointer">
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile')} className="cursor-pointer">
                Anuluj
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
