const API_URL = 'http://localhost:5174/api/gyms';

export const gymsService = {
  
  async getGyms() {
    const response = await fetch(`${API_URL}`);
    if (!response.ok) {
      const text = await response.text();
      console.error('Błąd backendu getGyms:', text);
      return { error: 'Nie udało się pobrać siłowni' };
    }
    return response.json();
  },

  async getGymById(id: string | number) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      const text = await response.text();
      console.error('Błąd backendu getGymById:', text);
      return { error: 'Nie udało się pobrać siłowni' };
    }
    return response.json();
  },

  async selectGym(id: number | string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Błąd backendu selectGym:', text);
      return { error: 'Nie udało się wybrać siłowni' };
    }

    return response.json();
  },


};