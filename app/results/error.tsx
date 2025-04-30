'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('SEO Analysis error:', error)
  }, [error])

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#FFDE59] flex items-center justify-center">
      <div className="neo-card bg-white text-center p-8 rotate-1 max-w-2xl w-full">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-16 w-16 text-[#FF5757]" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Analysis Error</h2>
        <p className="text-lg mb-6">
          We encountered an error while analyzing the website. This might be due to connectivity issues, 
          website restrictions, or limitations in our analysis tools.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="neo-button bg-[#3D5AFE] text-white"
          >
            Try Again
          </button>
          <Link href="/">
            <button className="neo-button bg-[#FF5757] text-white">
              Analyze Different Website
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
