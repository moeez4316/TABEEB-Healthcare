import React, { useState } from 'react';
import { FaExclamationTriangle, FaChevronDown, FaChevronUp, FaCheckCircle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface Complaint {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  patientName: string;
  adminNotes?: string | null;
  adminActionTaken?: string | null;
}

interface ComplaintsSectionProps {
  complaints: Complaint[];
  doctorUid: string;
  onUpdateComplaint?: (complaintId: string, notes: string, action: string) => void;
}

export const ComplaintsSection: React.FC<ComplaintsSectionProps> = ({
  complaints,
  doctorUid,
  onUpdateComplaint
}) => {
  const [showAll, setShowAll] = useState(false);
  const [expandedComplaint, setExpandedComplaint] = useState<string | null>(null);
  const displayedComplaints = showAll ? complaints : complaints.slice(0, 5);

  if (complaints.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
          <FaExclamationTriangle className="text-orange-500" />
          Patient Complaints
        </h2>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 shadow-lg border border-green-200 dark:border-green-800 text-center">
          <FaCheckCircle className="text-green-500 text-4xl mb-3 mx-auto" />
          <p className="text-green-700 dark:text-green-400 font-semibold">No complaints received</p>
          <p className="text-green-600 dark:text-green-500 text-sm mt-2">This doctor has a clean record</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
        <FaExclamationTriangle className="text-orange-500" />
        Patient Complaints ({complaints.length})
      </h2>

      <div className="space-y-4">
        {displayedComplaints.map((complaint) => (
          <div
            key={complaint.id}
            className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 shadow-lg border-l-4 border-orange-500"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold">
                  {complaint.patientName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {complaint.patientName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                  {complaint.rating} ★
                </span>
                <button
                  onClick={() => setExpandedComplaint(
                    expandedComplaint === complaint.id ? null : complaint.id
                  )}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  {expandedComplaint === complaint.id ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong className="text-orange-700 dark:text-orange-400">Complaint:</strong> {complaint.comment}
            </p>

            {expandedComplaint === complaint.id && (
              <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800 space-y-3">
                {complaint.adminNotes && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Admin Notes:
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {complaint.adminNotes}
                    </p>
                  </div>
                )}
                {complaint.adminActionTaken && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Action Taken:
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {complaint.adminActionTaken}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {complaints.length > 5 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors duration-300"
          >
            {showAll ? (
              <>
                <FaChevronUp />
                Show Less Complaints
              </>
            ) : (
              <>
                <FaChevronDown />
                Show All {complaints.length} Complaints
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
