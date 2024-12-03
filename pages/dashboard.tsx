import type { NextPage } from 'next'
import { useState } from 'react'
import Head from 'next/head'
import { usePrivy } from '@privy-io/react-auth'

// Define event type with duration
type Event = {
  id: string
  title: string
  startTime: string
  duration: number // duration in minutes
  isCore?: boolean
}

type DaySchedule = {
  date: Date
  events: Event[]
}

// Core events with duration
const coreEvents: Event[] = [
  { id: 'breakfast', title: 'Breakfast', startTime: '08:00', duration: 60, isCore: true },
  { id: 'lunch', title: 'Lunch', startTime: '12:00', duration: 90, isCore: true },
  { id: 'dinner', title: 'Dinner', startTime: '18:00', duration: 120, isCore: true },
]

// Admin emails - add your admin email here
const ADMIN_EMAILS = ['alarhaddad@gmail.com']

const Dashboard: NextPage = () => {
  const { user } = usePrivy()
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email)

  const generateDates = () => {
    const dates: DaySchedule[] = []
    const startDate = new Date('2024-12-29')
    const endDate = new Date('2025-01-05')
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      dates.push({
        date: new Date(date),
        events: [...coreEvents]
      })
    }
    return dates
  }

  const [schedule, setSchedule] = useState<DaySchedule[]>(generateDates())
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    startTime: '', 
    duration: 60,
    selectedDate: '' 
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Format time range
  const formatTimeRange = (startTime: string, duration: number) => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(start.getTime() + duration * 60000)
    
    return `${startTime} - ${end.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`
  }

  const handleAddEvent = (dayDate: Date) => {
    if (!newEvent.title || !newEvent.startTime) return

    const updatedSchedule = schedule.map(day => {
      if (day.date.toDateString() === dayDate.toDateString()) {
        return {
          ...day,
          events: [...day.events, {
            id: Date.now().toString(),
            title: newEvent.title,
            startTime: newEvent.startTime,
            duration: newEvent.duration,
            isCore: false
          }].sort((a, b) => a.startTime.localeCompare(b.startTime))
        }
      }
      return day
    })

    setSchedule(updatedSchedule)
    setNewEvent({ title: '', startTime: '', duration: 60, selectedDate: '' })
  }

  const handleDeleteEvent = (dayDate: Date, eventId: string) => {
    if (!isAdmin) return

    const updatedSchedule = schedule.map(day => {
      if (day.date.toDateString() === dayDate.toDateString()) {
        return {
          ...day,
          events: day.events.filter(event => event.id !== eventId)
        }
      }
      return day
    })

    setSchedule(updatedSchedule)
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-pink-500 p-4">
      <Head>
        <title>Jelloverse Schedule</title>
      </Head>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Jelloverse Schedule
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {schedule.map((day) => (
            <div 
              key={day.date.toISOString()} 
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                {formatDate(day.date)}
              </h2>

              {/* Events list */}
              <div className="space-y-2 mb-4">
                {day.events.map((event) => (
                  <div 
                    key={event.id}
                    className={`p-2 rounded ${
                      event.isCore 
                        ? 'bg-yellow-300/20 text-yellow-100'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    <div className="font-semibold">
                      {formatTimeRange(event.startTime, event.duration)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{event.title}</span>
                      {isAdmin && !event.isCore && (
                        <button
                          onClick={() => handleDeleteEvent(day.date, event.id)}
                          className="text-red-300 hover:text-red-400 text-sm"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="text-sm opacity-75">
                      Duration: {event.duration} min
                    </div>
                  </div>
                ))}
              </div>

              {/* Add event form */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Event title"
                  className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <input
                  type="time"
                  className="w-full p-2 rounded bg-white/20 text-white"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
                <select
                  className="w-full p-2 rounded bg-white/20 text-white"
                  value={newEvent.duration}
                  onChange={(e) => setNewEvent({ ...newEvent, duration: Number(e.target.value) })}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                </select>
                <button
                  onClick={() => handleAddEvent(day.date)}
                  className="w-full bg-yellow-300 hover:bg-yellow-400 text-purple-700 
                  font-bold py-2 px-4 rounded transition-colors"
                >
                  Add Event
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
