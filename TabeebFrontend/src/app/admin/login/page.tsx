'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`;
      console.log('🚀 Making admin login request to:', apiUrl);
      console.log('📝 Request body:', formData);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('📄 Raw response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Parsed JSON data:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        console.error('📄 Response was:', responseText);
        throw new Error('Server returned invalid JSON response');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store admin token
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify({
        username: data.admin.username,
        name: data.admin.name || data.admin.username,
      }));

      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <img
              src="/tabeeb_logo.png"
              alt="Tabeeb"
              className="h-12 w-12"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access the Tabeeb administrative panel
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter admin username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-colors`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in to Admin Panel'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/landing-page')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to Homepage
            </button>
          </div>
        </form>

        {/* Demo Credentials (for development) */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800">Available Admin Accounts:</h4>
          <div className="mt-2 text-sm text-yellow-700 space-y-1">
            <p><strong>Username:</strong> superadmin | <strong>Password:</strong> SuperAdmin123</p>
            <p><strong>Username:</strong> medadmin | <strong>Password:</strong> MedAdmin456</p>
            <p><strong>Username:</strong> verifyadmin | <strong>Password:</strong> VerifyAdmin789</p>
          </div>
          <p className="mt-2 text-xs text-yellow-600">
            These are the configured admin credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
