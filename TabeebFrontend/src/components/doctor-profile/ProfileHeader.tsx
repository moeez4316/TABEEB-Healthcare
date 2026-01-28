import React from 'react';
import Image from 'next/image';
import { FaStar, FaCheckCircle, FaMapMarkerAlt, FaBriefcase, FaGraduationCap } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { PublicDoctorProfile } from '@/types/doctor-profile';

interface ProfileHeaderProps {
  profile: PublicDoctorProfile;
  onBookAppointment?: () => void;
  showBookButton?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, 
  onBookAppointment,
  showBookButton = true 
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={index}
        className={index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
        size={20}
      />
    ));
  };

  return (
    <div className="bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 rounded-2xl shadow-2xl p-8 mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-white">
              {profile.profileImageUrl ? (
                <Image
                  src={profile.profileImageUrl}
                  alt={profile.name}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-500 text-white text-5xl font-bold">
                  {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </div>
              )}
            </div>
            {profile.verification.isVerified && (
              <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 shadow-lg" title="Verified Doctor">
                <MdVerified className="text-white" size={24} />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white">
                Dr. {profile.name}
              </h1>
              {profile.verification.isVerified && (
                <FaCheckCircle className="text-green-400" size={28} title="Verified" />
              )}
            </div>

            <p className="text-xl text-teal-100 mb-4 font-medium">
              {profile.specialization}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mb-6">
              {/* Rating */}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <div className="flex items-center gap-1">
                  {renderStars(profile.stats.averageRating)}
                </div>
                <span className="text-white font-bold text-lg">
                  {profile.stats.averageRating.toFixed(1)}
                </span>
                <span className="text-teal-100 text-sm">
                  ({profile.stats.totalReviews} reviews)
                </span>
              </div>

              {/* Experience */}
              {profile.experience && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <FaBriefcase className="text-teal-200" size={18} />
                  <span className="text-white font-semibold">
                    {profile.experience} years experience
                  </span>
                </div>
              )}

              {/* Patients */}
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-white font-semibold">
                  {profile.stats.totalPatients}+ Patients Treated
                </span>
              </div>
            </div>

            {/* Location & Credentials */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-teal-100 mb-6">
              {(profile.addressCity || profile.addressProvince) && (
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt size={16} />
                  <span>
                    {profile.addressCity}{profile.addressProvince && `, ${profile.addressProvince}`}
                  </span>
                </div>
              )}
              
              {profile.verification.pmdcNumber && (
                <div className="flex items-center gap-2">
                  <FaGraduationCap size={16} />
                  <span>PMDC: {profile.verification.pmdcNumber}</span>
                </div>
              )}
            </div>

            {/* Book Appointment Button */}
            {showBookButton && onBookAppointment && (
              <button
                onClick={onBookAppointment}
                className="bg-white text-teal-700 hover:bg-teal-50 font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Book Appointment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
