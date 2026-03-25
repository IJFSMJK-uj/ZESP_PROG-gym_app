import { useEffect, useState } from 'react'
import AvailabilityForm from '../components/AvailabilityForm'
import AvailabilityList from '../components/AvailabilityList'
import { availabilityService } from '../api/availabilityService'
import { authService } from '../api/authService'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'

export default function TrainerAvailabilityPage() {
  const [availability, setAvailability] = useState([])
  const [gyms, setGyms] = useState([])

  const fetchAvailability = async () => {
    const data = await availabilityService.getMyAvailability()
    setAvailability(data)
  }

  const fetchProfile = async () => {
    const data = await authService.getProfile()
    const mappedGyms =
      data.trainerGyms?.map((t: any) => t.gym) || []
    setGyms(mappedGyms)
  }

  const deleteItem = async (id: number) => {
    await availabilityService.delete(id)
    fetchAvailability()
  }

  useEffect(() => {
    fetchAvailability()
    fetchProfile()
  }, [])

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] p-4">
      <Card className="w-full max-w-lg bg-black border border-zinc-800 rounded-3xl">
        <CardHeader className="text-center pt-8">
          <CardTitle>Dostępność trenera</CardTitle>
          <CardDescription>
            Dodaj dni i godziny swojej dostępności
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <AvailabilityForm
            gyms={gyms}
            onAdd={fetchAvailability}
          />

          <AvailabilityList
            data={availability}
            onDelete={deleteItem}
          />
        </CardContent>
      </Card>
    </div>
  )
}