'use client';

import React, { useState, useEffect } from 'react';
import { FaUserMd, FaUser, FaBan, FaCheckCircle, FaSearch, FaFilter } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  role: 'doctor' | 'patient';
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'doctor' | 'patient'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate'>('suspend');
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    fetchUsers();
  }, [filter, statusFilter, router]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const adminToken = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('role', filter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`${API_URL}/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendClick = (user: User) => {
    setSelectedUser(user);
    setActionType('suspend');
    setShowConfirmModal(true);
  };

  const handleActivateClick = (user: User) => {
    setSelectedUser(user);
    setActionType('activate');
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const adminToken = localStorage.getItem('adminToken');
      
      const endpoint = actionType === 'suspend' ? 'suspend' : 'activate';
      const response = await fetch(`${API_URL}/api/admin/users/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: selectedUser.uid,
          role: selectedUser.role,
          ...(actionType === 'suspend' && suspendReason ? { reason: suspendReason } : {})
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} user`);
      }

      // Refresh the user list
      await fetchUsers();
      
      // Close modal
      setShowConfirmModal(false);
      setSelectedUser(null);
      setSuspendReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${actionType} user`);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    
    return matchesSearch;
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    suspendedUsers: users.filter(u => !u.isActive).length,
    doctors: users.filter(u => u.role === 'doctor').length,
    patients: users.filter(u => u.role === 'patient').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage doctor and patient accounts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-600 dark:text-green-400">Active</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.activeUsers}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-600 dark:text-red-400">Suspended</div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.suspendedUsers}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-600 dark:text-blue-400">Doctors</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.doctors}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-600 dark:text-purple-400">Patients</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.patients}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'doctor' | 'patient')}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors Only</option>
              <option value="patient">Patients Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            user.role === 'doctor' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                          }`}>
                            {user.role === 'doctor' ? (
                              <FaUserMd className="text-blue-600 dark:text-blue-300" />
                            ) : (
                              <FaUser className="text-purple-600 dark:text-purple-300" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.specialization && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.specialization}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'doctor' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.isActive ? (
                          <button
                            onClick={() => handleSuspendClick(user)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1"
                          >
                            <FaBan />
                            <span>Suspend</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateClick(user)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center space-x-1"
                          >
                            <FaCheckCircle />
                            <span>Activate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {actionType === 'suspend' ? 'Suspend Account' : 'Activate Account'}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to {actionType} the account of{' '}
                <strong className="text-gray-900 dark:text-white">
                  {selectedUser.firstName} {selectedUser.lastName}
                </strong>
                {' '}({selectedUser.role})?
              </p>

              {actionType === 'suspend' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-slate-700 dark:text-white"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedUser(null);
                    setSuspendReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`px-4 py-2 rounded-lg text-white ${
                    actionType === 'suspend'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {actionType === 'suspend' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
