import type { NextPage } from 'next'
import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/router'
import Head from 'next/head'

type ProfileData = {
  fullName: string
  displayName: string
  intro: string
}

const Profile: NextPage = () => {
  const { user, authenticated, ready } = usePrivy()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData>({
    fullName: '',
    displayName: '',
    intro: ''
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/')
    }
  }, [ready, authenticated, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Save profile data to your backend
    console.log('Profile data:', profile)
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 to-pink-500 p-4">
      <Head>
        <title>Profile - Jelloverse</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white mb-2">Email</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full p-3 rounded bg-white/20 text-white"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full p-3 rounded bg-white/20 text-white placeholder-white/50"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Display Name</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                className="w-full p-3 rounded bg-white/20 text-white placeholder-white/50"
                placeholder="Choose a display name"
              />
              <p className="text-white/70 text-sm mt-1">
                This is how other users will see you
              </p>
            </div>

            <div>
              <label className="block text-white mb-2">One Sentence Intro</label>
              <textarea
                value={profile.intro}
                onChange={(e) => setProfile({ ...profile, intro: e.target.value })}
                className="w-full p-3 rounded bg-white/20 text-white placeholder-white/50"
                placeholder="Tell us about yourself in one sentence"
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-purple-700 
              font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Save Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile 