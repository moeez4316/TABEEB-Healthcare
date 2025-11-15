'use client';

import React from 'react';
import Image from 'next/image';
import { Doctor } from '@/types/appointment';
import { FaStar, FaUserMd } from 'react-icons/fa';

interface DoctorSelectorProps {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  onDoctorSelect: (doctor: Doctor) => void;
  loading?: boolean;
}

export const DoctorSelector: React.FC<DoctorSelectorProps> = ({
  doctors,
  selectedDoctor,
  onDoctorSelect,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-slate-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <FaUserMd className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Doctors Found</h3>
        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select a Doctor</h3>
      
      {doctors.map((doctor) => (
        <div
          key={doctor.uid}
          className={`
            bg-white dark:bg-slate-800 border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 shadow-lg
            ${
              selectedDoctor?.uid === doctor.uid
                ? 'border-teal-500 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20 shadow-xl'
                : 'border-gray-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-500 hover:shadow-xl'
            }
          `}
          onClick={() => onDoctorSelect(doctor)}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1">
              {/* Doctor Avatar */}
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center overflow-hidden">
                {doctor.profileImageUrl ? (
                  <Image 
                    src={doctor.profileImageUrl} 
                    alt={`Dr. ${doctor.name}`} 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUserMd className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                )}
              </div>
              
              {/* Doctor Info */}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dr. {doctor.firstName && doctor.lastName 
                    ? `${doctor.firstName} ${doctor.lastName}`
                    : doctor.name
                  }
                </h4>
                <p className="text-teal-600 dark:text-teal-400 font-medium">{doctor.specialization}</p>
                {doctor.qualification && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.qualification}</p>
                )}
                {doctor.experience && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.experience} years experience</p>
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {doctor.rating && (
                    <div className="flex items-center space-x-1">
                      <FaStar className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{doctor.rating}</span>
                    </div>
                  )}
                  
                  {doctor.consultationFees && (
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <span className="font-medium">PKR {doctor.consultationFees.toLocaleString('en-PK')}/hr</span>
                    </div>
                  )}
                  
                  {doctor.isAvailable && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      Available
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Select Button */}
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
              <button
                className={`
                  w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors shadow-md
                  ${
                    selectedDoctor?.uid === doctor.uid
                      ? 'bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {selectedDoctor?.uid === doctor.uid ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
