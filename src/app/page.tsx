// Import Next.js Link component for client-side navigation
import Link from 'next/link';

// HomePage: The main landing page component for the Student Information System app
export default function HomePage() {
  return (
    // Centered container with background and padding
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      {/* Main heading: Application title and welcome message */}
      <h1 className="text-3xl font-bold mb-4">
        🎓 Welcome to the Student Information System of the University of St. Gallen
      </h1>
      {/* Brief instruction for users */}
      <p className="text-lg text-gray-700 mb-6">
        Please log in to access your personalized dashboard.
      </p>
      {/* Login button navigates to /login page */}
      <Link href="/login">
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Go to Login
        </button>
      </Link>
    </div>
  );
}