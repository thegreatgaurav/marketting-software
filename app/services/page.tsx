import Link from "next/link";

export default function Services() {
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
              <Link href="/about" className="text-gray-700 hover:text-gray-900 px-3 py-2">About</Link>
              <Link href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 font-semibold">Services</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2">Contact</Link>
              <Link href="/admin/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Admin Login</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-12 text-center">Our Services</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Lead Management</h2>
            <p className="text-gray-700 mb-4">
              Keep track of all your leads in an organized manner. Our system automatically stores 
              contact form submissions and allows you to manage them efficiently.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Automated lead capture</li>
              <li>Centralized lead database</li>
              <li>Easy lead tracking</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Messaging Solutions</h2>
            <p className="text-gray-700 mb-4">
              Send WhatsApp and SMS messages directly to your leads and customers through our 
              integrated messaging platform.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>WhatsApp messaging</li>
              <li>SMS notifications</li>
              <li>Bulk messaging support</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Media Management</h2>
            <p className="text-gray-700 mb-4">
              Upload, organize, and manage all your marketing media files in one secure location 
              with Google Drive integration.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>File uploads</li>
              <li>Secure storage</li>
              <li>Easy access</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Dashboard Analytics</h2>
            <p className="text-gray-700 mb-4">
              Access a comprehensive admin dashboard to view all your leads, messages, and media 
              in one place.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Real-time updates</li>
              <li>Data insights</li>
              <li>Export capabilities</li>
            </ul>
          </div>
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
