import Link from "next/link";

export default function Home() {
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
              <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Home
              </Link>
              {/* About and Services removed */}
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Contact
              </Link>
              <Link href="/admin/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-4">Welcome to MarketingPro</h1>
            <p className="text-xl mb-8">Transform your marketing efforts with our powerful platform</p>
            <Link href="/contact" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block">
              Get Started
            </Link>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Lead Management</h3>
                <p className="text-gray-600">Efficiently track and manage all your leads in one place.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Integrated Messaging</h3>
                <p className="text-gray-600">Send WhatsApp and SMS messages directly from your dashboard.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Media Management</h3>
                <p className="text-gray-600">Organize and access all your marketing media files easily.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 MarketingPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
