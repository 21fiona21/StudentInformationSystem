'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  // States for storing email, password, and error message
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Router hook for navigating after login
  const router = useRouter();

  // Function to handle login logic using Supabase
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Show error message if login fails
      setError(error.message);
    } else {
      // Get user role from metadata and navigate to appropriate dashboard
      const role = data.user.user_metadata?.role;
      switch (role) {
        case 'student':
          router.push('/dashboard/student');
          break;
        case 'lecturer':
          router.push('/dashboard/lecturer');
          break;
        case 'admin':
          router.push('/dashboard/admin');
          break;
        default:
          setError('Unknown role');
      }
    }
  };

  // Handle form submit to prevent default behavior and trigger login
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    // Container to center the login form vertically and horizontally
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* White box containing the login form */}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        {/* Page title */}
        <h1 className="text-2xl font-bold mb-2 text-center">Login</h1>
        {/* Instructional text */}
        <p className="text-sm text-gray-600 mb-6 text-center">
          Please enter your credentials. You will be redirected to your dashboard.
        </p>
        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input field */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
          {/* Password input field */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Log In
          </button>
        </form>
        {/* Show error message if login fails */}
        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}