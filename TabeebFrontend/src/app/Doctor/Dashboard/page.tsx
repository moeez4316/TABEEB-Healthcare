"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function DoctorDashboard() {
  const { signOut, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace("/auth");
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded shadow border border-gray-300 dark:bg-slate-900 dark:text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <button onClick={handleLogout} className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold shadow hover:bg-teal-700 transition">Log Out</button>
      </div>
      <div className="mb-4">
        <p className="text-lg">Welcome, <span className="font-semibold">{user?.displayName || user?.email || "Doctor"}</span>!</p>
        <p className="text-gray-500 mt-2">Here you can manage appointments, view your calendar, and more.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Appointments</h2>
          <p className="text-gray-600 dark:text-gray-400">View and manage your upcoming appointments.</p>
        </div>
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Calendar</h2>
          <p className="text-gray-600 dark:text-gray-400">Check your schedule and important dates.</p>
        </div>
      </div>
    </div>
  );
}
