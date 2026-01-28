'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  Stethoscope,
  Award,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ArrowUpDown,
  Users
} from 'lucide-react';

interface Doctor {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience?: number;
  city?: string;
  province?: string;
  pmdc?: string;
  profileImage?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function AdminDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'experience' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const adminToken = localStorage.getItem('adminToken');

      const response = await fetch(`${API_URL}/api/admin/doctors`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      setDoctors(data.doctors || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load doctors');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    fetchDoctors();
  }, [fetchDoctors, router]);

  // Get unique specializations
  const specializations = Array.from(new Set(doctors.map(d => d.specialization).filter(Boolean)));

  // Filter and sort doctors
  const filteredDoctors = doctors
    .filter(doctor => {
      const matchesSearch = 
        `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.city?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialization = 
        specializationFilter === 'all' || doctor.specialization === specializationFilter;

      const matchesVerification = 
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && doctor.isVerified) ||
        (verificationFilter === 'unverified' && !doctor.isVerified);

      return matchesSearch && matchesSpecialization && matchesVerification;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'experience':
          comparison = (b.experience || 0) - (a.experience || 0);
          break;
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <div className="w-full h-full border-4 border-cyan-200 dark:border-cyan-800 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Doctors</h3>
          <p className="text-gray-600 dark:text-gray-400">Fetching doctor profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                All Doctors
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Specialization Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Verification Filter */}
              <div className="relative">
                <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as 'all' | 'verified' | 'unverified')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as 'name' | 'experience' | 'createdAt');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="experience-desc">Most Experience</option>
                  <option value="experience-asc">Least Experience</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Doctors Grid */}
          {filteredDoctors.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-12">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Doctors Found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || specializationFilter !== 'all' || verificationFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No doctors registered yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map(doctor => (
                <div
                  key={doctor.uid}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden"
                >
                  {/* Doctor Header */}
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="relative">
                        {doctor.profileImage ? (
                          <Image
                            src={doctor.profileImage}
                            alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                            width={80}
                            height={80}
                            className="rounded-full border-4 border-white shadow-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-lg">
                            <Stethoscope className="w-10 h-10 text-cyan-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {doctor.isVerified ? (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 shadow-sm">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 shadow-sm">
                            <AlertCircle className="w-3 h-3" />
                            Unverified
                          </span>
                        )}
                        {!doctor.isActive && (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 shadow-sm">
                            <XCircle className="w-3 h-3" />
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h3>
                    {doctor.specialization && (
                      <p className="text-cyan-100 text-sm flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {doctor.specialization}
                      </p>
                    )}
                  </div>

                  {/* Doctor Details */}
                  <div className="p-6 space-y-3">
                    {doctor.experience !== null && doctor.experience !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{doctor.experience} years experience</span>
                      </div>
                    )}
                    
                    {(doctor.city || doctor.province) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {doctor.city}
                          {doctor.city && doctor.province && ', '}
                          {doctor.province}
                        </span>
                      </div>
                    )}

                    {doctor.pmdc && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">PMDC:</span> {doctor.pmdc}
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                      <Link href={`/admin/doctors/${doctor.uid}`}>
                        <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                          <Eye className="w-4 h-4" />
                          View Full Profile
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
