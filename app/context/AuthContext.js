// app/context/AuthContext.js (Create this new file)
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import Spinner from '@/app/components/Spinner'; // Assuming Spinner is here

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store user data if logged in
  const [isLoading, setIsLoading] = useState(true); // Check auth status on initial load

  // Function to fetch current user session from backend
  const checkUserSession = useCallback(async () => {
    // No setIsLoading(true) here, it's set before the initial call in useEffect
    console.log("AuthContext: checkUserSession START"); // Log start
    let success = false; // Track success
    try {
      const response = await fetch('/api/auth/session', {
         method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' }
      });
      console.log(`AuthContext: /api/auth/session response status: ${response.status}`); // Log status
  
      if (response.ok) {
        const userData = await response.json();
        console.log("AuthContext: fetch OK, setting user:", userData); // Log user data
        setUser(userData); // Set user state
        success = true;
      } else {
        console.log("AuthContext: fetch Not OK, setting user to null.");
        setUser(null); // Clear user state
        if (response.status !== 401) {
            console.warn(`AuthContext: Auth Check: Failed with status ${response.status}`);
        }
      }
    } catch (error) {
      console.error("AuthContext: Error fetching user session:", error);
      setUser(null); // Assume not logged in on error
    } finally {
      console.log(`AuthContext: checkUserSession FINALLY block. Success: ${success}. Setting isLoading false.`);
      setIsLoading(false); // Set loading false *after* fetch and setUser attempt
    }
  }, []); // Empty dependency array means stable reference
  
  useEffect(() => {
    console.log("AuthProvider Effect: Mounting or checkUserSession changed. Setting isLoading true and calling checkUserSession.");
    setIsLoading(true); // Ensure loading is true before check starts
    checkUserSession();
    // This effect should run once on initial mount due to stable checkUserSession reference
  }, [checkUserSession]);

  // Login function to update context (called from LoginPage)
  const login = (userData) => {
    setUser(userData);
  };

    // Logout function to update context and call backend logout
    const logout = async () => {
        console.log("AuthContext: logout() started. Setting user=null locally.");
        setUser(null); // Update local state immediately
        
        try {
            console.log("AuthContext: Attempting fetch to /api/auth/logout...");
            const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            });
            console.log(`AuthContext: Backend logout response status: ${response.status}`);
            if (!response.ok) {
            console.warn(`AuthContext: Backend logout call failed with status ${response.status}`);
            } else {
            console.log("AuthContext: Backend logout call successful.");
            }
        } catch (error) {
            console.error("AuthContext: Network/fetch error during backend logout call:", error);
        } finally {
            console.log("AuthContext: logout() finished.");
            // NO checkUserSession here
        }
        };

  // Show a loading indicator while checking the initial session
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Spinner className="text-blue-500 w-8 h-8" />
        <span className="ml-3 text-lg text-gray-300">Initializing...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, checkUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context easily in components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Handle case where context is defined but null during initial server render?
  // Usually, the loading state prevents components from accessing null context prematurely.
  return context;
};