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
  age: number;
  gender: string;
  medicalHistory: string;
};

export default function SelectRolePage() {
  const { token } = useAuth();
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
    age: 0,
    gender: "",
    medicalHistory: "",
  });
  const router = useRouter();

  // Redirect if role is already set
  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    if (token && storedRole) {
      console.log("[SelectRole] Found role in localStorage:", storedRole);
      router.replace(storedRole === "doctor" ? "/Doctor/Dashboard" : "/Patient/dashboard");
      return;
    }
    // If no role in localStorage, check backend
    const checkRole = async () => {
      if (!token) {
        console.log("[SelectRole] No token available, skipping backend fetch.");
        return;
      }
      console.log("[SelectRole] Using token for backend fetch:", token);
      try {
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        // Try doctor profile first
        const doctorRes = await fetch(`${API_URL}/api/doctor`, { headers: headers });
        console.log("[SelectRole] Doctor profile status:", doctorRes.status);
        if (doctorRes.ok) {
          localStorage.setItem('role', 'doctor');
          console.log("[SelectRole] Doctor profile found, redirecting to Doctor/Dashboard");
          router.replace('/Doctor/Dashboard');
          return;
        }
        // Only try patient if doctor is not found
        if (doctorRes.status === 404) {
          const patientRes = await fetch(`${API_URL}/api/patient`, { headers: headers });
          console.log("[SelectRole] Patient profile status:", patientRes.status);
          if (patientRes.ok) {
            localStorage.setItem('role', 'patient');
            console.log("[SelectRole] Patient profile found, redirecting to Patient/dashboard");
            router.replace('/Patient/dashboard');
            return;
          }
        }
        console.log("[SelectRole] No profile found, showing role selection form");
      } catch (err) {
        console.error("[SelectRole] Error fetching role from backend:", err);
      }
    };
    if (token && !storedRole) checkRole();
  }, [router, token]);

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
        age: Number(patientForm.age),
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
      localStorage.setItem("role", role);
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
          <input name="age" placeholder="Age" required type="number" value={patientForm.age} onChange={handlePatientChange} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
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
