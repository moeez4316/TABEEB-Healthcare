"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type DoctorForm = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  experience: number;
};

type PatientForm = {
  name: string;
  email: string;
  phone: string;
  dob: string; // ISO date string
  gender: string;
  medicalHistory: string;
};

export default function SelectRolePage() {
  const { token, role: userRole, setUserRole, loading, roleLoading } = useAuth();
  const [role, setRole] = useState<"doctor" | "patient" | "">("");
  const [doctorForm, setDoctorForm] = useState<DoctorForm>({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: 0,
  });
  const [patientForm, setPatientForm] = useState<PatientForm>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    medicalHistory: "",
  });
  const router = useRouter();

  // Redirect if user already has a role (wait for loading to complete)
  useEffect(() => {
    if (!loading && !roleLoading && userRole && userRole !== 'no-role') {
      console.log("[SelectRole] User already has role:", userRole);
      if (userRole === 'doctor') {
        router.replace('/Doctor/Dashboard');
      } else if (userRole === 'patient') {
        router.replace('/Patient/dashboard');
      }
    }
  }, [userRole, loading, roleLoading, router]);

  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDoctorForm({ ...doctorForm, [e.target.name]: e.target.value });
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPatientForm({ ...patientForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let endpoint = "";
    let body = {};
    if (role === "doctor") {
      endpoint = "/api/doctor";
      body = { ...doctorForm, experience: Number(doctorForm.experience) };
    } else if (role === "patient") {
      endpoint = "/api/patient";
      body = {
        ...patientForm,
        dob: patientForm.dob ? new Date(patientForm.dob).toISOString() : "",
        medicalHistory: patientForm.medicalHistory || ""
      };
    }
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      console.log("Selected role:", role);
      setUserRole(role); // This will update both context and localStorage
      router.replace(role === "doctor" ? "/Doctor/Dashboard" : "/Patient/dashboard");
    } else {
      alert("Failed to submit profile");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded shadow border border-gray-300 dark:bg-slate-900 dark:text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Select Your Role</h2>
      <div className="flex gap-4 mb-6 justify-center">
        <button onClick={() => setRole("doctor")} className={`px-6 py-3 rounded-lg font-semibold shadow transition border border-teal-600 ${role === "doctor" ? "bg-teal-600 text-white" : "bg-gray-100 text-teal-700"}`}>I am a Doctor</button>
        <button onClick={() => setRole("patient")} className={`px-6 py-3 rounded-lg font-semibold shadow transition border border-teal-600 ${role === "patient" ? "bg-teal-600 text-white" : "bg-gray-100 text-teal-700"}`}>I am a Patient</button>
      </div>
      {role === "doctor" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Name" required value={doctorForm.name} onChange={handleDoctorChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input name="email" placeholder="Email" required type="email" value={doctorForm.email} onChange={handleDoctorChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input name="phone" placeholder="Phone" required value={doctorForm.phone} onChange={handleDoctorChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input name="specialization" placeholder="Specialization" required value={doctorForm.specialization} onChange={handleDoctorChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input name="qualification" placeholder="Qualification" required value={doctorForm.qualification} onChange={handleDoctorChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input name="experience" placeholder="Experience (years)" required type="number" value={doctorForm.experience} onChange={handleDoctorChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold shadow">Submit</button>
        </form>
      )}
      {role === "patient" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Name" required value={patientForm.name} onChange={handlePatientChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input name="email" placeholder="Email" required type="email" value={patientForm.email} onChange={handlePatientChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input name="phone" placeholder="Phone" required value={patientForm.phone} onChange={handlePatientChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input name="dob" placeholder="Date of Birth" required type="date" value={patientForm.dob} onChange={handlePatientChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <select name="gender" required value={patientForm.gender} onChange={handlePatientChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input name="medicalHistory" placeholder="Medical History" value={patientForm.medicalHistory} onChange={handlePatientChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold shadow">Submit</button>
        </form>
      )}
    </div>
  );
}
