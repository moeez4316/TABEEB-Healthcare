"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { User, UserCheck, Stethoscope, Heart, Mail, Phone, GraduationCap, Award, Calendar, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { getDoctorRedirectPath } from "@/lib/doctorRedirect";
import ProfileImageUpload from "@/components/shared/ProfileImageUpload";
import { formatPhoneNumber, isValidEmail, isValidPhoneNumber, pakistaniMedicalSpecializations, pakistaniMedicalQualifications } from "@/lib/profile-utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type DoctorForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  specialization: string;
  qualification: string;
  experience: number;
  profileImage?: string;
};

type PatientForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  profileImage?: string;
};

type FormErrors = {
  [key: string]: string;
};

export default function SelectRolePage() {
  const { token, role: userRole, setUserRole, loading, roleLoading, user, verificationStatus, verificationLoading } = useAuth();
  const [role, setRole] = useState<"doctor" | "patient" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [doctorForm, setDoctorForm] = useState<DoctorForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    specialization: "",
    qualification: "",
    experience: 0,
    profileImage: "",
  });
  
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [customQualification, setCustomQualification] = useState("");
  
  const [patientForm, setPatientForm] = useState<PatientForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    profileImage: "",
  });
  
  const router = useRouter();

  // Detect auth method
  const isPhoneAuth = user?.email?.endsWith('@tabeeb.phone') || false;
  const isEmailAuth = !isPhoneAuth && !!user?.email;

  // Pre-fill form with user data when user becomes available
  useEffect(() => {
    if (user) {
      // Check if email is a phone-based email (ends with @tabeeb.phone)
      const isPhoneAuth = user.email?.endsWith('@tabeeb.phone');
      const phoneFromEmail = isPhoneAuth ? user.email?.replace('@tabeeb.phone', '') : '';
      
      setDoctorForm(prev => ({
        ...prev,
        firstName: '', // Let user fill their actual name
        lastName: '', // Let user fill their actual name
        email: isPhoneAuth ? '' : (user.email || ''), // Pre-fill for email auth, empty for phone auth
        phone: phoneFromEmail || '', // Pre-fill phone if from phone auth
      }));
      setPatientForm(prev => ({
        ...prev,
        firstName: '', // Let user fill their actual name
        lastName: '', // Let user fill their actual name
        email: isPhoneAuth ? '' : (user.email || ''), // Pre-fill for email auth, empty for phone auth
        phone: phoneFromEmail || '', // Pre-fill phone if from phone auth
      }));
    }
  }, [user]);

  // Redirect if user already has a role
  useEffect(() => {
    if (!loading && !roleLoading && userRole && userRole !== 'no-role') {
      console.log("[SelectRole] User already has role:", userRole);
      if (userRole === 'doctor') {
        // Wait for verification status before redirecting doctors
        if (verificationLoading) return;
        router.replace(getDoctorRedirectPath(verificationStatus));
      } else if (userRole === 'patient') {
        router.replace('/Patient/dashboard');
      }
    }
  }, [userRole, loading, roleLoading, verificationStatus, verificationLoading, router]);

  const validateDoctorForm = (): boolean => {
    const errors: FormErrors = {};
    const today = new Date();
    const dobDate = new Date(doctorForm.dateOfBirth);
    const age = today.getFullYear() - dobDate.getFullYear();
    
    if (!doctorForm.firstName.trim()) errors.firstName = "First name is required";
    if (!doctorForm.lastName.trim()) errors.lastName = "Last name is required";
    
    // Email: required for phone auth users, pre-filled and disabled for email auth
    if (isPhoneAuth) {
      // Phone auth: email is optional, validate only if provided
      if (doctorForm.email.trim() && !isValidEmail(doctorForm.email)) errors.email = "Invalid email format";
    } else {
      // Email auth: email is pre-filled and required (disabled)
      if (!doctorForm.email.trim()) errors.email = "Email is required";
      else if (!isValidEmail(doctorForm.email)) errors.email = "Invalid email format";
    }
    
    // Phone: optional for email auth users, pre-filled and disabled for phone auth
    if (isEmailAuth) {
      // Email auth: phone is optional, validate only if provided
      if (doctorForm.phone.trim() && !isValidPhoneNumber(doctorForm.phone)) errors.phone = "Invalid phone number. Use Pakistani format: +923001234567 or 03001234567";
    } else {
      // Phone auth: phone is pre-filled and required (disabled)
      if (!doctorForm.phone.trim()) errors.phone = "Phone number is required";
      else if (!isValidPhoneNumber(doctorForm.phone)) errors.phone = "Invalid phone number. Use Pakistani format: +923001234567 or 03001234567";
    }
    if (!doctorForm.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    else if (dobDate > today) errors.dateOfBirth = "Date of birth cannot be in the future";
    else if (age > 150) errors.dateOfBirth = "Invalid date of birth";
    if (!doctorForm.specialization.trim()) errors.specialization = "Specialization is required";
    else if (doctorForm.specialization === "Other" && !customSpecialization.trim()) {
      errors.customSpecialization = "Please specify your specialization";
    }
    if (!doctorForm.qualification.trim()) errors.qualification = "Qualification is required";
    else if (doctorForm.qualification === "Other" && !customQualification.trim()) {
      errors.customQualification = "Please specify your qualification";
    }
    if (doctorForm.experience < 0) errors.experience = "Experience cannot be negative";
    if (doctorForm.experience > 100) errors.experience = "Experience seems too high";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePatientForm = (): boolean => {
    const errors: FormErrors = {};
    const today = new Date();
    const dobDate = new Date(patientForm.dateOfBirth);
    const age = today.getFullYear() - dobDate.getFullYear();
    
    if (!patientForm.firstName.trim()) errors.firstName = "First name is required";
    if (!patientForm.lastName.trim()) errors.lastName = "Last name is required";
    
    // Email: required for phone auth users, pre-filled and disabled for email auth
    if (isPhoneAuth) {
      // Phone auth: email is optional, validate only if provided
      if (patientForm.email.trim() && !isValidEmail(patientForm.email)) errors.email = "Invalid email format";
    } else {
      // Email auth: email is pre-filled and required (disabled)
      if (!patientForm.email.trim()) errors.email = "Email is required";
      else if (!isValidEmail(patientForm.email)) errors.email = "Invalid email format";
    }
    
    // Phone: optional for email auth users, pre-filled and disabled for phone auth
    if (isEmailAuth) {
      // Email auth: phone is optional, validate only if provided
      if (patientForm.phone.trim() && !isValidPhoneNumber(patientForm.phone)) errors.phone = "Invalid phone number. Use Pakistani format: +923001234567 or 03001234567";
    } else {
      // Phone auth: phone is pre-filled and required (disabled)
      if (!patientForm.phone.trim()) errors.phone = "Phone number is required";
      else if (!isValidPhoneNumber(patientForm.phone)) errors.phone = "Invalid phone number. Use Pakistani format: +923001234567 or 03001234567";
    }
    if (!patientForm.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    else if (dobDate > today) errors.dateOfBirth = "Date of birth cannot be in the future";
    else if (age > 150) errors.dateOfBirth = "Invalid date of birth";
    if (!patientForm.gender) errors.gender = "Gender is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Format phone number as user types
    if (name === "phone") {
      processedValue = formatPhoneNumber(value);
    }
    
    setDoctorForm(prev => ({
      ...prev,
      [name]: name === "experience" ? parseInt(value) || 0 : processedValue
    }));
    
    // Reset custom specialization when changing from "Other"
    if (name === "specialization" && value !== "Other") {
      setCustomSpecialization("");
    }
    
    // Reset custom qualification when changing from "Other"
    if (name === "qualification" && value !== "Other") {
      setCustomQualification("");
    }
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCustomSpecializationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSpecialization(e.target.value);
    // Clear error for custom specialization field
    if (formErrors.customSpecialization) {
      setFormErrors(prev => ({ ...prev, customSpecialization: "" }));
    }
  };

  const handleCustomQualificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomQualification(e.target.value);
    // Clear error for custom qualification field
    if (formErrors.customQualification) {
      setFormErrors(prev => ({ ...prev, customQualification: "" }));
    }
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Format phone number as user types
    if (name === "phone") {
      processedValue = formatPhoneNumber(value);
    }
    
    setPatientForm(prev => ({ ...prev, [name]: processedValue }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePatientImageChange = (imageUrl: string) => {
    setPatientForm(prev => ({ ...prev, profileImage: imageUrl }));
  };

  const handleDoctorImageChange = (imageUrl: string) => {
    setDoctorForm(prev => ({ ...prev, profileImage: imageUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    const isValid = role === "doctor" ? validateDoctorForm() : validatePatientForm();
    if (!isValid) return;

    setSubmitting(true);
    
    try {
      let endpoint = "";
      
      if (role === "doctor") {
        endpoint = "/api/doctor";
        const formData = new FormData();
        
        // Use custom specialization if "Other" is selected
        const finalSpecialization = doctorForm.specialization === "Other" ? customSpecialization : doctorForm.specialization;
        // Use custom qualification if "Other" is selected
        const finalQualification = doctorForm.qualification === "Other" ? customQualification : doctorForm.qualification;
        
        // Append all text fields
        formData.append("firstName", doctorForm.firstName);
        formData.append("lastName", doctorForm.lastName);
        formData.append("email", doctorForm.email);
        formData.append("phone", doctorForm.phone);
        formData.append("gender", doctorForm.gender);
        formData.append("specialization", finalSpecialization);
        formData.append("qualification", finalQualification);
        formData.append("experience", doctorForm.experience.toString());
        if (doctorForm.dateOfBirth) {
          formData.append("dateOfBirth", new Date(doctorForm.dateOfBirth).toISOString());
        }
        
        // Convert base64 image to File if exists
        if (doctorForm.profileImage && doctorForm.profileImage.startsWith('data:image')) {
          const blob = await fetch(doctorForm.profileImage).then(r => r.blob());
          
          // Validate file size (5MB limit to match backend)
          if (blob.size > 5 * 1024 * 1024) {
            setError("Profile image must be less than 5MB");
            setSubmitting(false);
            return;
          }
          
          const file = new File([blob], "profile.jpg", { type: blob.type });
          formData.append("profileImage", file);
        }
        
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: formData,
        });
        
        if (res.ok) {
          console.log("Selected role:", role);
          setUserRole(role);
          setSuccess("Profile created successfully! Redirecting...");
          setTimeout(() => {
            router.replace(getDoctorRedirectPath(null));
          }, 1500);
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || "Failed to create profile. Please try again.");
        }
        
      } else if (role === "patient") {
        endpoint = "/api/patient";
        const formData = new FormData();
        
        // Append all text fields
        formData.append("firstName", patientForm.firstName);
        formData.append("lastName", patientForm.lastName);
        formData.append("email", patientForm.email);
        formData.append("phone", patientForm.phone);
        formData.append("gender", patientForm.gender);
        if (patientForm.dateOfBirth) {
          formData.append("dateOfBirth", new Date(patientForm.dateOfBirth).toISOString());
        }
        
        // Convert base64 image to File if exists
        if (patientForm.profileImage && patientForm.profileImage.startsWith('data:image')) {
          const blob = await fetch(patientForm.profileImage).then(r => r.blob());
          
          // Validate file size (5MB limit to match backend)
          if (blob.size > 5 * 1024 * 1024) {
            setError("Profile image must be less than 5MB");
            setSubmitting(false);
            return;
          }
          
          const file = new File([blob], "profile.jpg", { type: blob.type });
          formData.append("profileImage", file);
        }
        
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: formData,
        });
        
        if (res.ok) {
          console.log("Selected role:", role);
          setUserRole(role);
          setSuccess("Profile created successfully! Redirecting...");
          setTimeout(() => {
            router.replace("/Patient/dashboard");
          }, 1500);
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.message || "Failed to create profile. Please try again.");
        }
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tell us a bit about yourself to get started with TABEEB
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 space-y-8 border border-gray-200 dark:border-slate-700">
          {/* TABEEB Logo */}
          <div className="flex flex-col items-center space-y-1">
            <Image src="/tabeeb_logo.png" alt="TABEEB Logo" width={64} height={64} className="object-contain" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-wide">
                TABEEB
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-0.5">
                Healthcare Platform
              </p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              I am a...
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRole("doctor")}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                  role === "doctor"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600"
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-full ${
                    role === "doctor" ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-slate-700"
                  }`}>
                    <Stethoscope className={`h-8 w-8 ${
                      role === "doctor" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                    }`} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Doctor</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Medical Professional</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setRole("patient")}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                  role === "patient"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                    : "border-gray-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-600"
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-full ${
                    role === "patient" ? "bg-teal-100 dark:bg-teal-800" : "bg-gray-100 dark:bg-slate-700"
                  }`}>
                    <Heart className={`h-8 w-8 ${
                      role === "patient" ? "text-teal-600 dark:text-teal-400" : "text-gray-600 dark:text-gray-400"
                    }`} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Patient</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Seeking Healthcare</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            </div>
          )}

          {/* Doctor Form */}
          {role === "doctor" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Profile Picture (Optional)
                </label>
                <ProfileImageUpload
                  currentImage={doctorForm.profileImage}
                  onImageChange={handleDoctorImageChange}
                  size="lg"
                  className="mb-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Upload a professional profile picture for your medical practice
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={doctorForm.firstName}
                      onChange={handleDoctorChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="Enter your first name"
                    />
                  </div>
                  {formErrors.firstName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={doctorForm.lastName}
                      onChange={handleDoctorChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="Enter your last name"
                    />
                  </div>
                  {formErrors.lastName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address {isPhoneAuth ? '(Optional)' : '*'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required={!isPhoneAuth}
                      disabled={isEmailAuth}
                      value={doctorForm.email}
                      onChange={handleDoctorChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      } ${isEmailAuth ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={isPhoneAuth ? "Enter your email (optional)" : "Enter your email"}
                    />
                  </div>
                  {formErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number {isEmailAuth ? '(Optional)' : '*'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required={!isEmailAuth}
                      disabled={isPhoneAuth}
                      value={doctorForm.phone}
                      onChange={handleDoctorChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      } ${isPhoneAuth ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={isEmailAuth ? "+923001234567 or 03001234567 (optional)" : "+923001234567 or 03001234567"}
                    />
                  </div>
                  {formErrors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      required
                      value={doctorForm.dateOfBirth}
                      onChange={handleDoctorChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                    />
                  </div>
                  {formErrors.dateOfBirth && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <select
                      name="gender"
                      required
                      value={doctorForm.gender}
                      onChange={handleDoctorChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {formErrors.gender && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.gender}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years of Experience *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Award className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="number"
                      name="experience"
                      required
                      min="0"
                      max="100"
                      value={doctorForm.experience}
                      onChange={handleDoctorChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.experience ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="Years of experience"
                    />
                  </div>
                  {formErrors.experience && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.experience}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialization *
                </label>
                <select
                  name="specialization"
                  required
                  value={doctorForm.specialization}
                  onChange={handleDoctorChange}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    formErrors.specialization ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select your specialization</option>
                  {pakistaniMedicalSpecializations.map((spec: string) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                {formErrors.specialization && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.specialization}</p>}
              </div>

              {/* Custom Specialization Input - Only show when "Other" is selected */}
              {doctorForm.specialization === "Other" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Please specify your specialization *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Stethoscope className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={customSpecialization}
                      onChange={handleCustomSpecializationChange}
                      required
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.customSpecialization ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="Enter your specialization"
                    />
                  </div>
                  {formErrors.customSpecialization && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.customSpecialization}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Qualification *
                </label>
                <select
                  name="qualification"
                  required
                  value={doctorForm.qualification}
                  onChange={handleDoctorChange}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    formErrors.qualification ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select your qualification</option>
                  {pakistaniMedicalQualifications.map((qual: string) => (
                    <option key={qual} value={qual}>{qual}</option>
                  ))}
                </select>
                {formErrors.qualification && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.qualification}</p>}
              </div>

              {/* Custom Qualification Input - Only show when "Other" is selected */}
              {doctorForm.qualification === "Other" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Please specify your qualification *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GraduationCap className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={customQualification}
                      onChange={handleCustomQualificationChange}
                      required
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.customQualification ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="Enter your qualification"
                    />
                  </div>
                  {formErrors.customQualification && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.customQualification}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Complete Doctor Profile'
                )}
              </button>
            </form>
          )}

          {/* Patient Form */}
          {role === "patient" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Profile Picture (Optional)
                </label>
                <ProfileImageUpload
                  currentImage={patientForm.profileImage}
                  onImageChange={handlePatientImageChange}
                  size="lg"
                  className="mb-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Upload a profile picture to personalize your account
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={patientForm.firstName}
                      onChange={handlePatientChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
                      }`}
                      placeholder="Enter your first name"
                    />
                  </div>
                  {formErrors.firstName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={patientForm.lastName}
                      onChange={handlePatientChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
                      }`}
                      placeholder="Enter your last name"
                    />
                  </div>
                  {formErrors.lastName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address {isPhoneAuth ? '(Optional)' : '*'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required={!isPhoneAuth}
                      disabled={isEmailAuth}
                      value={patientForm.email}
                      onChange={handlePatientChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
                      } ${isEmailAuth ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={isPhoneAuth ? "Enter your email (optional)" : "Enter your email"}
                    />
                  </div>
                  {formErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number {isEmailAuth ? '(Optional)' : '*'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required={!isEmailAuth}
                      disabled={isPhoneAuth}
                      value={patientForm.phone}
                      onChange={handlePatientChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
                      } ${isPhoneAuth ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={isEmailAuth ? "+923001234567 or 03001234567 (optional)" : "+923001234567 or 03001234567"}
                    />
                  </div>
                  {formErrors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      required
                      value={patientForm.dateOfBirth}
                      onChange={handlePatientChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
                      }`}
                    />
                  </div>
                  {formErrors.dateOfBirth && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.dateOfBirth}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  required
                  value={patientForm.gender}
                  onChange={handlePatientChange}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    formErrors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
                  }`}
                >
                  <option value="">Select your gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                {formErrors.gender && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.gender}</p>}
              </div>



              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Complete Patient Profile'
                )}
              </button>
            </form>
          )}

          {!role && (
            <div className="text-center py-8">
              <UserCheck className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Please select your role to continue
              </p>
            </div>
          )}
        </div>

        {/* Footer Branding */}
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2025 TABEEB Healthcare Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
