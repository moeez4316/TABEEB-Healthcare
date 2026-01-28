import React from 'react';
import { FaUserMd, FaCheckCircle, FaCalendarCheck, FaStar } from 'react-icons/fa';
import { MdPeople } from 'react-icons/md';
import { PublicDoctorProfile } from '@/types/doctor-profile';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
    <div className="flex items-center justify-between mb-3">
      <div className="text-white/80 text-3xl">{icon}</div>
      <div className="text-white/90 text-sm font-medium">{label}</div>
    </div>
    <div className="text-white text-3xl font-bold">{value}</div>
  </div>
);

interface StatsSectionProps {
  stats: PublicDoctorProfile['stats'];
  experience?: string | null;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, experience }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Professional Statistics
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<MdPeople />}
          label="Patients Treated"
          value={stats.totalPatients}
          color="from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
        />
        
        <StatsCard
          icon={<FaCalendarCheck />}
          label="Appointments"
          value={stats.completedAppointments}
          color="from-green-500 to-green-600 dark:from-green-600 dark:to-green-700"
        />
        
        <StatsCard
          icon={<FaStar />}
          label="Average Rating"
          value={`${stats.averageRating.toFixed(1)}/5.0`}
          color="from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700"
        />
        
        <StatsCard
          icon={<FaUserMd />}
          label="Years Experience"
          value={experience ? `${experience}+` : 'N/A'}
          color="from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700"
        />
      </div>
    </div>
  );
};
