"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const isLoggedIn = !!user;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = async () => {
    console.log("Navbar: handleLogout called.");
    try {
      await logout();
      console.log("Navbar: Context logout() promise resolved.");
    } catch (error) {
      console.error("Navbar: Error occurred during context logout call:", error);
    } finally {
      setIsMobileMenuOpen(false);
      console.log("Navbar: Pushing to /");
      router.push('/');
    }
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href={isLoggedIn ? "/transcribe" : "/"} className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              QuickNote
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-6">
            {isLoggedIn ? (
              <>
                <Link href="/transcribe" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Transcribe
                </Link>
                <Link href="/history" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  History
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:bg-pink-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors bg-pink-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link href="/register" className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
             {!isLoggedIn && (
                 <div className="flex items-center space-x-2 mr-2">
                    <Link href="/login" className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium transition-colors">Login</Link>
                    <Link href="/register" className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md text-sm font-medium">Reg</Link>
                 </div>
             )}
             {isLoggedIn && (
                <button
                  onClick={toggleMobileMenu}
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  aria-controls="mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                 >
                   <span className="sr-only">Open main menu</span>
                   <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                   </svg>
                   <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
             )}
          </div>
        </div>
      </div>

     {isLoggedIn && (
       <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden transition-all duration-300 ease-out border-t border-gray-700`} id="mobile-menu">
         <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
           <Link href="/transcribe" onClick={()=>setIsMobileMenuOpen(false)} className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">Transcribe</Link>
           <Link href="/history" onClick={()=>setIsMobileMenuOpen(false)} className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">History</Link>
           <button
             onClick={handleLogout}
             className="w-full text-left text-gray-300 hover:bg-pink-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors bg-pink-600 mt-2"
            >
             Logout
           </button>
         </div>
       </div>
     )}
    </nav>
  );
};

export default Navbar;