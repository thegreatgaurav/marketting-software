import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                MarketingPro
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2">Home</Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 px-3 py-2 font-semibold">About</Link>
              <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2">Services</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2">Contact</Link>
              <Link href="/admin/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Admin Login</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-6">About Us</h1>
        <div className="prose prose-lg">
          <p className="text-gray-700 mb-4">
            MarketingPro is a comprehensive marketing platform designed to help businesses manage their leads, 
            communicate effectively, and streamline their marketing operations.
          </p>
          <p className="text-gray-700 mb-4">
            Our platform integrates seamlessly with Google Sheets for data management, Google Drive for file storage, 
            and VervBridge for messaging capabilities, providing you with a complete solution for your marketing needs.
          </p>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="text-gray-700">
            To empower businesses with tools that make marketing management simple, efficient, and effective.
          </p>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 MarketingPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
