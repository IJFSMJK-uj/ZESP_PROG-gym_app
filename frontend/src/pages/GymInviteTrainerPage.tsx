import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { inviteService } from '../api/inviteService';

export const GymInviteTrainerPage = () => {
    const { hash } = useParams<{ hash: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [usingInvite, setUsingInvite] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [inviteData, setInviteData] = useState<{
        valid?: boolean;
        gymId?: number;
        gymName?: string | null;
        expirationDate?: string;
    } | null>(null);

    useEffect(() => {
        const loadInvite = async () => {
            if (!hash) {
                setError('Brak hasha zaproszenia');
                setLoading(false);
                return;
            }

            try {
                const data = await inviteService.getTrainerInvite(hash);

                if (data.error) {
                    setError(data.error);
                } else {
                    setInviteData(data);
                }
            } catch {
                setError('Nie udało się sprawdzić zaproszenia');
            } finally {
                setLoading(false);
            }
        };

        loadInvite();
    }, [hash]);

    const handleUseInvite = async () => {
        if (!hash) {
            setError('Brak hasha zaproszenia');
            return;
        }

        setUsingInvite(true);
        setError('');
        setSuccess('');

        try {
            const data = await inviteService.useTrainerInvite(hash);

            if (data.error) {
                setError(data.error);
            } else {
                setSuccess(data.message || 'Zaproszenie zostało wykorzystane');
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            }
        } catch {
            setError('Nie udało się wykorzystać zaproszenia');
        } finally {
            setUsingInvite(false);
        }
    };

    if (!localStorage.getItem('token')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
                <p className="text-lg text-white mb-4">
                    Musisz się zalogować, aby zaakceptować zaproszenie trenera
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
                <p className="text-white">Sprawdzanie zaproszenia...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
                <p className="text-red-400 mb-4 text-2xl text-center">{error}</p>
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
            <Card className="w-full max-w-xl bg-black border border-zinc-800 rounded-3xl">
                <CardHeader className="text-center">
                    <CardTitle>Zaproszenie na trenera</CardTitle>
                    <CardDescription>
                        To zaproszenie przypisze Twoje konto do roli trenera
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center gap-4">
                    <div className="text-center">
                        <p className="text-white text-lg">
                            Siłownia:{' '}
                            <span className="font-semibold">
                {inviteData?.gymName || 'Nieznana siłownia'}
              </span>
                        </p>

                        {inviteData?.expirationDate && (
                            <p className="text-zinc-400 text-sm mt-2">
                                Ważne do: {new Date(inviteData.expirationDate).toLocaleString()}
                            </p>
                        )}
                    </div>

                    {success && (
                        <p className="text-green-400 text-center">{success}</p>
                    )}

                    <Button
                        variant="outline"
                        onClick={handleUseInvite}
                        disabled={usingInvite}
                        className="cursor-pointer"
                    >
                        {usingInvite ? 'Akceptowanie...' : 'Akceptuj zaproszenie'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
