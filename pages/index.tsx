import type { NextPage } from 'next'
import Head from 'next/head'
import { usePrivy } from '@privy-io/react-auth'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

// Types for schedule
type Event = {
  id: string
  title: string
  startTime: string
  duration: number
  isCore?: boolean
}

type DaySchedule = {
  date: Date
  events: Event[]
}

// Core events
const coreEvents: Event[] = [
  { id: 'breakfast', title: 'Breakfast', startTime: '08:00', duration: 60, isCore: true },
  { id: 'lunch', title: 'Lunch', startTime: '12:00', duration: 90, isCore: true },
  { id: 'dinner', title: 'Dinner', startTime: '18:00', duration: 120, isCore: true },
]

const Home: NextPage = () => {
  const { login, authenticated, ready, logout, user } = usePrivy()
  const [activeTab, setActiveTab] = useState<'schedule' | 'games'>('schedule')
  const [schedule, setSchedule] = useState<DaySchedule[]>(generateDates())
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    startTime: '', 
    duration: 60,
    selectedDate: '' 
  })
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Generate dates
  function generateDates() {
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-purple-500 to-pink-500">
      {/* Header with auth */}
      <header className="w-full p-4 bg-purple-600/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Jelloverse</h1>
          <div className="relative" ref={dropdownRef}>
            {authenticated ? (
              <>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-yellow-300 hover:bg-yellow-400 text-purple-700 
                  px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                  flex items-center gap-2"
                >
                  <span>{user?.email || 'User'}</span>
                  <span className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg py-1 z-10">
                    <Link 
                      href="/profile"
                      className="block px-4 py-2 text-purple-700 hover:bg-purple-50 transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsDropdownOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-purple-700 hover:bg-purple-50 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={login}
                className="bg-yellow-300 hover:bg-yellow-400 text-purple-700 
                px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className="bg-purple-600/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-3 px-4 text-white font-medium ${
                activeTab === 'schedule' ? 'border-b-2 border-yellow-300' : ''
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`py-3 px-4 text-white font-medium ${
                activeTab === 'games' ? 'border-b-2 border-yellow-300' : ''
              }`}
            >
              Games
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {activeTab === 'schedule' ? (
          <div className="max-w-6xl mx-auto">
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
                        <div>{event.title}</div>
                        <div className="text-sm opacity-75">
                          Duration: {event.duration} min
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add event form */}
                  {authenticated && (
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
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Games Coming Soon!</h2>
            <p>Stay tuned for exciting Jelloverse games.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
