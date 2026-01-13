'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Package, Bell, User, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { API_BASE_URL, getApiUrl } from '@/lib/config';
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
  email: string;
  role: string;
  id: number;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Package },
    { href: '/dispatch', label: 'Dispatch', icon: Package },
    { href: '/shipments', label: 'Shipments', icon: Package },
    { href: '/receive', label: 'Receive', icon: Package },
  ];

  // Fetch user data on mount and when pathname changes
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Use getApiUrl helper to construct URL with basePath
        // This ensures cookies are sent properly
        const res = await fetch(getApiUrl("/api/auth/me"), {
          credentials: "include", // Important: include cookies in request
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserData(data.user);
          }
        } else if (res.status === 401) {
          // Not authenticated, clear user data
          setUserData(null);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setUserData(null);
      }
    };

    // Add a small delay to ensure cookies are available after login redirect
    const timer = setTimeout(() => {
      fetchUserData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [pathname]); // Refetch when pathname changes (e.g., after login redirect)

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      // Use getApiUrl helper to construct URL with basePath
      const res = await fetch(getApiUrl("/api/notifications"), {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const newCount = data.data.unreadCount || data.data.stats?.unread || 0;
          // Update count (React will optimize re-renders if value is same)
          setUnreadCount((prevCount) => {
            if (prevCount !== newCount) {
              return newCount;
            }
            return prevCount;
          });
          setIsLoadingNotifications(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
      setIsLoadingNotifications(false);
    }
  };

  // Fetch unread count on mount and set up polling for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Poll every 10 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 10000); // 10 seconds

    // Also refetch when user navigates to/from notifications page
    const handleFocus = () => {
      fetchUnreadCount();
    };
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Update count when pathname changes (user navigates to notifications page)
  useEffect(() => {
    if (pathname === '/notifications') {
      // Refetch immediately when on notifications page
      fetchUnreadCount();
    }
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-3 group"
            >
              <div className="relative w-10 h-10">
                <Image
                  src="/chak-dosimetry-ts/cbsl.svg"
                  alt="CHAK Logo"
                  fill
                  className="object-contain rounded-lg group-hover:scale-105 transition-transform duration-200"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 font-heading">
                  CBSL Tracker
                </h1>
                <p className="text-xs text-gray-500">Inventory Management</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section - User Menu & Notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Link 
              href="/notifications" 
              className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <motion.div
                animate={unreadCount > 0 ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, -10, 10, 0]
                } : {}}
                transition={{ 
                  duration: 0.5,
                  repeat: unreadCount > 0 ? Infinity : 0,
                  repeatDelay: 3
                }}
              >
                <Bell className="w-5 h-5" />
              </motion.div>
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 30 
                    }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center shadow-lg z-10"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Pulse animation ring when there are unread notifications */}
              {unreadCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white"
                  animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.7, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
            </Link>

            {/* User Profile */}
            <div className="relative" ref={profileRef}>
              {userData ? (
                <>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {userData.email ? userData.email.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {userData.email || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {userData.role === 'ADMIN' ? 'Administrator' : 'User'}
                      </p>
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {userData.email || 'User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userData.role === 'ADMIN' ? 'Administrator' : userData.role || 'User'}
                        </p>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile Settings</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <Package className="w-4 h-4" />
                          <span>System Settings</span>
                        </Link>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">Sign In</p>
                    <p className="text-xs text-gray-500">Login to continue</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="md:hidden bg-white border-t border-gray-200 rounded-b-xl shadow-lg absolute left-4 right-4 z-40"
          >
            <div className="py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}