import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { inviteService } from '../api/inviteService';
import { authService } from "../api/authService";

interface TrainerInvite {
    id: number;
    gymId: number;
    hash: string;
    expirationDate: string;
    alreadyUsed: boolean;
}

export const GymCreateTrainerInvitePage = () => {
    const navigate = useNavigate();

    const [invites, setInvites] = useState<TrainerInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [role, setRole] = useState('');

    const FRONTEND_URL = 'http://localhost:5173';
    const expiresInHours = 48;

    const token = localStorage.getItem('token');

    const loadInvites = async () => {
        const data = await inviteService.getActiveTrainerInvites();

        if (data.error) {
            setError(data.error);
            return false;
        }

        setInvites(data);
        return true;
    };

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

                const ok = await loadInvites();
                if (!ok) return;
            } catch {
                setError('Nie udało się pobrać danych strony');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [token]);

    const handleGenerateInvite = async () => {
        setGenerating(true);
        setError('');
        setSuccess('');

        try {
            const data = await inviteService.generateTrainerInvite(expiresInHours);

            if (data.error) {
                setError(data.error);
            } else {
                setSuccess('Wygenerowano nowe zaproszenie dla trenera.');
                await loadInvites();
            }
        } catch {
            setError('Nie udało się wygenerować zaproszenia');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async (hash: string, inviteId: number) => {
        const fullLink = `${FRONTEND_URL}/trainer-invite/${hash}`;

        try {
            await navigator.clipboard.writeText(fullLink);
            setCopiedId(inviteId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            setError('Nie udało się skopiować linku');
        }
    };

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
                <p className="text-lg text-white mb-4">
                    Musisz się zalogować, aby generować zaproszenia dla trenerów
                </p>
                <Button
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="cursor-pointer"
                >
                    Przejdź do logowania
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-white">Ładowanie danych...</p>
            </div>
        );
    }

    if (role !== 'GYM') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
                <p className="text-lg text-red-400 mb-4 text-center">
                    Tylko konto siłowni ma dostęp do tej strony
                </p>
                <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="cursor-pointer"
                >
                    Powrót
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 flex justify-center">
            <div className="w-full max-w-5xl flex flex-col gap-6">
                <Card className="bg-black border border-zinc-800 rounded-3xl">
                    <CardHeader>
                        <CardTitle>Generowanie zaproszeń dla trenerów</CardTitle>
                        <CardDescription>
                            Wygeneruj jednorazowy link dla trenera. Link jest ważny przez {expiresInHours} godzin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {error && <p className="text-red-400">{error}</p>}
                        {success && <p className="text-green-400">{success}</p>}

                        <div>
                            <Button
                                variant="outline"
                                onClick={handleGenerateInvite}
                                disabled={generating}
                                className="cursor-pointer"
                            >
                                {generating ? 'Generowanie...' : 'Wygeneruj link'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black border border-zinc-800 rounded-3xl">
                    <CardHeader>
                        <CardTitle>Aktywne zaproszenia</CardTitle>
                        <CardDescription>
                            Poniżej znajdują się wszystkie ważne i niewykorzystane linki.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invites.length === 0 ? (
                            <p className="text-zinc-400">Brak aktywnych zaproszeń.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {invites.map((invite) => {
                                    const fullLink = `${FRONTEND_URL}/trainer-invite/${invite.hash}`;

                                    return (
                                        <div
                                            key={invite.id}
                                            className="border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3"
                                        >
                                            <div>
                                                <p className="text-sm text-zinc-400">Link:</p>
                                                <p className="text-sm break-all text-white">
                                                    {fullLink}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-zinc-400">Ważny do:</p>
                                                <p className="text-white">
                                                    {new Date(invite.expirationDate).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="cursor-pointer"
                                                    onClick={() => handleCopy(invite.hash, invite.id)}
                                                >
                                                    Kopiuj link
                                                </Button>

                                                {copiedId === invite.id && (
                                                    <span className="text-green-400 text-sm">
                                                        Skopiowano
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};