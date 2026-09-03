import React, { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import Navbar from '../../components/hotelOwner/Navbar'
import Sidebar from '../../components/hotelOwner/Sidebar'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {
  const { isSignedIn } = useAuth()
  const { isOwner } = useAppContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/')
      return
    }

    if (!isOwner) {
      navigate('/')
    }
  }, [isSignedIn, isOwner, navigate])

  return (
    <div className='flex flex-col h-screen'>

      <Navbar />

      <div className='flex flex-1'>

        <Sidebar />

        <div className='flex-1 p-4 pt-10 md:px-10'>
          <Outlet />
        </div>

      </div>

    </div>
  )
}

export default Layout