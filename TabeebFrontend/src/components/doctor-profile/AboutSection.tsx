import React from 'react';
import { FaGraduationCap, FaIdCard, FaLanguage, FaDollarSign, FaUniversity, FaCalendar } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { PublicDoctorProfile } from '@/types/doctor-profile';

interface AboutSectionProps {
  profile: PublicDoctorProfile;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ profile }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        About & Credentials
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Qualifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <FaGraduationCap className="text-teal-600 dark:text-teal-400" />
            Qualifications
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {profile.qualification}
              </p>
            </div>
            
            {profile.verification.degreeInstitution && (
              <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <FaUniversity className="mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Institution</p>
                  <p>{profile.verification.degreeInstitution}</p>
                </div>
              </div>
            )}
            
            {profile.verification.graduationYear && (
              <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <FaCalendar className="mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Graduation Year</p>
                  <p>{profile.verification.graduationYear}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Professional Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <MdVerified className="text-teal-600 dark:text-teal-400" />
            Professional Details
          </h3>
          
          <div className="space-y-4">
            {profile.verification.pmdcNumber && (
              <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <FaIdCard className="mt-1 flex-shrink-0 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">PMDC Registration</p>
                  <p className="font-mono">{profile.verification.pmdcNumber}</p>
                  {profile.verification.isVerified && (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm mt-1">
                      <MdVerified size={16} />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
              <FaLanguage className="mt-1 flex-shrink-0 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Language</p>
                <p>{profile.language}</p>
              </div>
            </div>
            
            {profile.hourlyConsultationRate && (
              <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                <FaDollarSign className="mt-1 flex-shrink-0 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Consultation Fee</p>
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    PKR {profile.hourlyConsultationRate.toLocaleString()}/hr
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
