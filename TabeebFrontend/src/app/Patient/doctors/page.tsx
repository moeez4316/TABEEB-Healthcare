'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaSearch, FaSort, FaUserMd, FaStar, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '@/lib/auth-context';

interface Doctor {
  uid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  specialization: string;
  qualification: string;
  experience: number;
  profileImageUrl?: string;
  createdAt: string;
  verification: {
    status: string;
    isVerified: boolean;
  };
}

interface DoctorsResponse {
  doctors: Doctor[];
  filterOptions: {
    specializations: string[];
  };
  total: number;
}

export default function DoctorsPage() {
  const { } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [specializations, setSpecializations] = useState<string[]>([]);

  const fetchDoctors = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/doctor/verified`);
      
      if (response.ok) {
        const data: DoctorsResponse = await response.json();
        setDoctors(data.doctors);
        setSpecializations(data.filterOptions.specializations);
      } else {
        console.error('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDoctors = useCallback(() => {
    let filtered = [...doctors];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply specialization filter
    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(doctor =>
        doctor.specialization.toLowerCase().includes(selectedSpecialization.toLowerCase())
      );
    }

    // Apply experience filter
    if (experienceFilter) {
      const minExperience = parseInt(experienceFilter);
      filtered = filtered.filter(doctor => doctor.experience >= minExperience);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'experience':
          aValue = a.experience || 0;
          bValue = b.experience || 0;
          break;
        case 'specialization':
          aValue = a.specialization.toLowerCase();
          bValue = b.specialization.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, selectedSpecialization, experienceFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterAndSortDoctors();
  }, [filterAndSortDoctors]);

  const handleBookAppointment = (doctorUid: string) => {
    // Navigate to appointment booking with doctor pre-selected
    router.push(`/Patient/book-appointment?doctorId=${doctorUid}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-[#18181b]/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-10 px-2 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1e293b] dark:text-[#ededed] drop-shadow-sm mb-2">Find Doctors</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and connect with verified medical professionals</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-md mb-6 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or specialization..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Specialization Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
              >
                <option value="all">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Filter */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
              >
                <option value="">Any Experience</option>
                <option value="1">1+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="10">10+ Years</option>
                <option value="15">15+ Years</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="specialization">Specialization</option>
                  <option value="experience">Experience</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#2a2a32] transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <FaSort />
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {filteredDoctors.length} of {doctors.length} verified doctors
            </span>
            {(searchTerm || selectedSpecialization !== 'all' || experienceFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSpecialization('all');
                  setExperienceFilter('');
                }}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.uid} className="bg-white/80 dark:bg-[#18181b]/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-md">
              {/* Doctor Avatar */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 p-6">
                <div className="w-16 h-16 bg-white/90 dark:bg-white/95 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden">
                  {doctor.profileImageUrl ? (
                    <Image 
                      src={doctor.profileImageUrl} 
                      alt={`Dr. ${doctor.name}`} 
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUserMd className="text-2xl text-teal-600 dark:text-teal-700" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white text-center drop-shadow-sm">
                  Dr. {doctor.firstName && doctor.lastName 
                    ? `${doctor.firstName} ${doctor.lastName}`
                    : doctor.name
                  }
                </h3>
              </div>

              {/* Doctor Info */}
              <div className="p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Specialization</p>
                    <p className="font-semibold text-[#1e293b] dark:text-[#ededed]">{doctor.specialization}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Qualification</p>
                    <p className="font-semibold text-[#1e293b] dark:text-[#ededed]">{doctor.qualification}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Experience</p>
                    <p className="font-semibold text-[#1e293b] dark:text-[#ededed]">
                      {doctor.experience ? `${doctor.experience} years` : 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Verification Badge */}
                <div className="mt-4 flex items-center">
                  <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                    <FaStar className="mr-1" />
                    Verified Doctor
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleBookAppointment(doctor.uid)}
                  className="w-full mt-4 bg-gradient-to-r from-teal-600 to-teal-700 dark:from-teal-500 dark:to-teal-600 text-white py-2 px-4 rounded-lg hover:from-teal-700 hover:to-teal-800 dark:hover:from-teal-600 dark:hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  <FaCalendarAlt />
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredDoctors.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-white/80 dark:bg-[#18181b]/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-md max-w-md mx-auto">
              <FaUserMd className="text-4xl text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1e293b] dark:text-[#ededed] mb-2">No doctors found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedSpecialization !== 'all' || experienceFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'No verified doctors are available at the moment.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
