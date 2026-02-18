'use client'

import { signOut, useSession } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Use setTimeout to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen])

  if (!session?.user) return null

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Avatar clicked, isOpen:', isOpen, 'will become:', !isOpen);
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-[var(--mint-accent-2)] hover:border-[var(--mint-accent-2)] hover:bg-[rgba(16,185,129,0.16)] transition-all group cursor-pointer"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity"></div>
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User'}
              width={32}
              height={32}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full relative border-2 border-[var(--mint-accent-2)]"
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] flex items-center justify-center relative border-2 border-[var(--mint-accent-2)]">
              <span className="text-white text-xs sm:text-sm font-semibold">
                {session.user.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Name (hidden on mobile) */}
        <span className="hidden sm:block text-[var(--mint-accent-1)] text-sm font-medium">
          {session.user.name?.split(' ')[0] || 'User'}
        </span>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-[var(--mint-accent-1)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 rounded-xl bg-[var(--mint-surface)] border-2 border-[var(--mint-accent-2)] shadow-2xl shadow-[0_0_24px_var(--mint-accent-glow)] overflow-hidden z-[9999]">
          {/* User Info Section */}
          <div className="p-3 sm:p-4 border-b border-[var(--mint-accent-2)] bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)]">
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={48}
                  height={48}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[var(--mint-accent-2)]"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] flex items-center justify-center border-2 border-[var(--mint-accent-2)]">
                  <span className="text-white text-lg font-semibold">
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {session.user.name || 'User'}
                </p>
                <p className="text-[var(--mint-text-secondary)] text-xs truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              type="button"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-[var(--mint-text-secondary)] hover:bg-[rgba(16,185,129,0.16)] hover:text-[var(--mint-accent-1)] transition-colors flex items-center gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/account');
                setIsOpen(false);
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Account
            </button>

            <button
              type="button"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-[var(--mint-accent-1)] hover:bg-[rgba(16,185,129,0.16)] hover:text-[var(--mint-accent-1)] transition-colors flex items-center gap-2 font-medium cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Upgrade button clicked');
                router.push('/pricing');
                setIsOpen(false);
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade
            </button>
          </div>

          {/* Sign Out Section */}
          <div className="border-t border-[var(--mint-accent-2)]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Sign out button clicked');
                signOut({ callbackUrl: '/home' });
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
