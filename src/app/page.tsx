
import Link from 'next/link'
import React from 'react'

function Home() {
  return (
    <div className='flex items-center justify-center text-8xl'>
      <Link href={'/login'}>Login</Link>
    </div>
  )
}

export default Home