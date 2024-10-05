'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Menu, X, Code, Book, Home, Mail, LogIn, LogOut } from 'lucide-react'
import { useEffect } from 'react';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Courses', href: '/courses', icon: Book },
  { name: 'Contact', href: '/contact', icon: Mail },
];

export function LayoutComponent({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Überprüfen, ob der Benutzer eingeloggt ist und ob er Admin ist
  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsLoggedIn(!!token);
    setIsAdmin(adminStatus);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    // Optional: Weiterleitung zur Startseite oder Login-Seite
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-pink-500">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center"
            >
              <Code className="mr-2" />
              Devla
            </motion.div>
          </Link>
          <div className="hidden md:flex space-x-4">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.1, color: '#ec4899' }}
                  className="flex items-center"
                >
                  <item.icon className="mr-1" size={18} />
                  {item.name}
                </motion.div>
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                {isAdmin && ( // Nur anzeigen, wenn der Benutzer ein Admin ist
                  <Link href="/admin">
                    <motion.div
                      whileHover={{ scale: 1.1, color: '#ec4899' }}
                      className="flex items-center"
                    >
                      Admin Dashboard
                    </motion.div>
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center">
                  <LogOut className="mr-1" size={18} />
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.1, color: '#ec4899' }}
                  className="flex items-center"
                >
                  <LogIn className="mr-1" size={18} />
                  Login
                </motion.div>
              </Link>
            )}
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-grow">{children}</main>
      <footer className="bg-gray-800 p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>&copy; 2023 Devla. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}