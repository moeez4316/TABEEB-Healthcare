"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { User, UserCheck, Stethoscope, Heart, Mail, Phone, GraduationCap, Award, AlertTriangle, CheckCircle, Loader2, LogOut, Calendar } from "lucide-react";
import Image from "next/image";
import { getDoctorRedirectPath } from "@/lib/doctorRedirect";
import ProfileImageUpload from "@/components/shared/ProfileImageUpload";
import { formatPhoneNumber, isValidEmail, isValidPhoneNumber, pakistaniMedicalSpecializations, pakistaniMedicalQualifications } from "@/lib/profile-utils";
import { APP_CONFIG } from "@/lib/config/appConfig";
import { uploadFile } from "@/lib/cloudinary-upload";
import { LinearProgress } from "@/components/shared/UploadProgress";
import { fetchWithRateLimit } from "@/lib/api-utils";

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
  experience: string;
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
  const { token, role: userRole, setUserRole, loading, roleLoading, user, verificationStatus, verificationLoading, signOut } = useAuth();
  const [role, setRole] = useState<"doctor" | "patient" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const doctorDobRef = useRef<HTMLInputElement>(null);
  const patientDobRef = useRef<HTMLInputElement>(null);
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  
  const [doctorForm, setDoctorForm] = useState<DoctorForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    specialization: "",
    qualification: "",
    experience: "",
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
      const formattedPhone = phoneFromEmail ? formatPhoneNumber(phoneFromEmail) : '';
      
      setDoctorForm(prev => ({
        ...prev,
        firstName: '', // Let user fill their actual name
        lastName: '', // Let user fill their actual name
        email: isPhoneAuth ? '' : (user.email || ''), // Pre-fill for email auth, empty for phone auth
        phone: formattedPhone, // Pre-fill phone if from phone auth (formatted with dashes)
      }));
      setPatientForm(prev => ({
        ...prev,
        firstName: '', // Let user fill their actual name
        lastName: '', // Let user fill their actual name
        email: isPhoneAuth ? '' : (user.email || ''), // Pre-fill for email auth, empty for phone auth
        phone: formattedPhone, // Pre-fill phone if from phone auth (formatted with dashes)
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
      // Email auth: phone is optional, validate only if provided and not just the prefix
      const phoneValue = doctorForm.phone.trim();
      const isJustPrefix = phoneValue === '' || phoneValue === '+92-' || phoneValue === '+92' || phoneValue === '+';
      if (phoneValue && !isJustPrefix && !isValidPhoneNumber(phoneValue)) errors.phone = "Invalid phone number. Use Pakistani format: +923001234567 or 03001234567";
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
    const experienceNum = parseInt(doctorForm.experience);
    if (doctorForm.experience !== '' && experienceNum < 0) errors.experience = "Experience cannot be negative";
    if (doctorForm.experience !== '' && experienceNum > 100) errors.experience = "Experience seems too high";
    
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
      // Email auth: phone is optional, validate only if provided and not just the prefix
      const phoneValue = patientForm.phone.trim();
      const isJustPrefix = phoneValue === '' || phoneValue === '+92-' || phoneValue === '+92' || phoneValue === '+';
      if (phoneValue && !isJustPrefix && !isValidPhoneNumber(phoneValue)) errors.phone = "Invalid phone number. Use Pakistani format: +923001234567 or 03001234567";
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
      [name]: processedValue
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
    setUploadStatus('idle');
    setUploadProgress(0);
    
    try {
      let profileImagePublicId: string | undefined;
      let profileImageUrl: string | undefined;
      
      // ====== STEP 1: Upload image FIRST if selected (validation already passed) ======
      const imageToUpload = role === "doctor" ? doctorForm.profileImage : patientForm.profileImage;
      const hasImageToUpload = imageToUpload && imageToUpload.startsWith('data:image') && token;
      
      if (hasImageToUpload) {
        const blob = await fetch(imageToUpload).then(r => r.blob());
        
        if (blob.size > 2 * 1024 * 1024) {
          setError("Profile image must be less than 2MB");
          setSubmitting(false);
          return;
        }
        
        const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
        
        try {
          setUploadStatus('uploading');
          const uploadResult = await uploadFile(file, 'profile-image', token!, {
            onProgress: (p) => setUploadProgress(p.percentage)
          });
          profileImagePublicId = uploadResult.publicId;
          profileImageUrl = uploadResult.secureUrl;
          setUploadStatus('success');
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          setUploadStatus('error');
          setError(uploadError instanceof Error ? uploadError.message : "Failed to upload profile image");
          setSubmitting(false);
          return;
        }
      }
      
      // ====== STEP 2: Create profile WITH the image URL (so DB is never empty) ======
      let createRes: Response;
      
      if (role === "doctor") {
        const finalSpecialization = doctorForm.specialization === "Other" ? customSpecialization : doctorForm.specialization;
        const finalQualification = doctorForm.qualification === "Other" ? customQualification : doctorForm.qualification;
        
        createRes = await fetchWithRateLimit(`${API_URL}/api/doctor`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            firstName: doctorForm.firstName,
            lastName: doctorForm.lastName,
            email: doctorForm.email,
            phone: doctorForm.phone,
            gender: doctorForm.gender,
            specialization: finalSpecialization,
            qualification: finalQualification,
            experience: doctorForm.experience ? parseInt(doctorForm.experience) : 0,
            dateOfBirth: doctorForm.dateOfBirth ? new Date(doctorForm.dateOfBirth).toISOString() : undefined,
            profileImagePublicId,
            profileImageUrl,
          }),
        });
      } else {
        createRes = await fetchWithRateLimit(`${API_URL}/api/patient`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            firstName: patientForm.firstName,
            lastName: patientForm.lastName,
            email: patientForm.email,
            phone: patientForm.phone,
            gender: patientForm.gender,
            dateOfBirth: patientForm.dateOfBirth ? new Date(patientForm.dateOfBirth).toISOString() : undefined,
            profileImagePublicId,
            profileImageUrl,
          }),
        });
      }
      
      if (createRes.ok) {
        console.log("Selected role:", role);
        setUserRole(role);
        setSuccess("Profile created successfully! Redirecting...");
        setTimeout(() => {
          if (role === "doctor") {
            router.replace(getDoctorRedirectPath(null));
          } else {
            router.replace("/Patient/dashboard");
          }
        }, 1500);
      } else {
        const errorData = await createRes.json().catch(() => ({}));
        setError(errorData.error || errorData.message || "Failed to create profile. Please try again.");
      }
      
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };



  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      localStorage.clear();
      router.push('/landing-page');
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      {/* Floating Upload Progress Overlay */}
      {uploadStatus !== 'idle' && uploadStatus !== 'success' && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
          <div className={`mx-auto max-w-lg mt-4 px-4`}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
              uploadStatus === 'error'
                ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-800'
                : `${role === 'doctor' ? 'bg-blue-50/95 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800' : 'bg-teal-50/95 dark:bg-teal-950/90 border-teal-200 dark:border-teal-800'}`
            }`}>
              {uploadStatus === 'uploading' && (
                <>
                  <Loader2 className={`h-5 w-5 animate-spin flex-shrink-0 ${role === 'doctor' ? 'text-blue-600 dark:text-blue-400' : 'text-teal-600 dark:text-teal-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${role === 'doctor' ? 'text-blue-700 dark:text-blue-300' : 'text-teal-700 dark:text-teal-300'}`}>
                      Uploading profile image... {Math.round(uploadProgress)}%
                    </p>
                    <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ease-out ${role === 'doctor' ? 'bg-blue-500' : 'bg-teal-500'}`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
              {uploadStatus === 'error' && (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Upload failed — please try again</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3 animate-in fade-in duration-500">
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
            <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={64} height={64} className="object-contain" />
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
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  role === "doctor"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10"
                    : "border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
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
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  role === "patient"
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md shadow-teal-500/10"
                    : "border-gray-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-sm"
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
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 stagger-children animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Profile Image Upload — Hero Section */}
              <div className="relative -mx-8 -mt-8 mb-6 px-8 pt-8 pb-6 bg-gradient-to-b from-blue-50 via-blue-50/50 to-transparent dark:from-blue-950/30 dark:via-blue-950/10 dark:to-transparent rounded-t-xl">
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative group">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-400 opacity-20 group-hover:opacity-40 blur-md transition-opacity duration-500 animate-glow-pulse" />
                    <ProfileImageUpload
                      currentImage={doctorForm.profileImage}
                      onImageChange={handleDoctorImageChange}
                      size="lg"
                      className="relative z-10"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Profile Picture
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload a professional photo for your medical practice
                    </p>
                  </div>
                </div>
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
                      placeholder="+92-123-4567890"
                    />
                  </div>
                  {formErrors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => doctorDobRef.current?.showPicker()}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      ref={doctorDobRef}
                      type="date"
                      name="dateOfBirth"
                      required
                      value={doctorForm.dateOfBirth}
                      onChange={handleDoctorChange}
                      onClick={(e) => {
                        e.stopPropagation();
                        (e.target as HTMLInputElement).showPicker();
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 cursor-pointer ${
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
                  <select
                    name="gender"
                    required
                    value={doctorForm.gender}
                    onChange={handleDoctorChange}
                    className={`block w-full px-3 py-3 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      formErrors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.gender && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.gender}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Years of Experience
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Award className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="experience"
                      value={doctorForm.experience}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          handleDoctorChange(e);
                        }
                      }}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        formErrors.experience ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="e.g. 5"
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
                disabled={submitting || uploadStatus === 'uploading'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]"
              >
                {submitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>{uploadStatus === 'uploading' ? 'Uploading Image...' : 'Creating Profile...'}</span></>
                ) : (
                  <><Stethoscope className="h-5 w-5" /><span>Complete Doctor Profile</span></>
                )}
              </button>
            </form>
          )}

          {/* Patient Form */}
          {role === "patient" && (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 stagger-children animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Profile Image Upload — Hero Section */}
              <div className="relative -mx-8 -mt-8 mb-6 px-8 pt-8 pb-6 bg-gradient-to-b from-teal-50 via-teal-50/50 to-transparent dark:from-teal-950/30 dark:via-teal-950/10 dark:to-transparent rounded-t-xl">
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative group">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-400 opacity-20 group-hover:opacity-40 blur-md transition-opacity duration-500 animate-glow-pulse" />
                    <ProfileImageUpload
                      currentImage={patientForm.profileImage}
                      onImageChange={handlePatientImageChange}
                      size="lg"
                      className="relative z-10"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                      Profile Picture
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload a profile picture to personalize your account
                    </p>
                  </div>
                </div>
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
                      placeholder="+92-123-4567890"
                    />
                  </div>
                  {formErrors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => patientDobRef.current?.showPicker()}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      ref={patientDobRef}
                      type="date"
                      name="patientDateOfBirth"
                      required
                      value={patientForm.dateOfBirth}
                      onChange={(e) => handlePatientChange({ target: { name: 'dateOfBirth', value: e.target.value } } as React.ChangeEvent<HTMLInputElement>)}
                      onClick={(e) => {
                        e.stopPropagation();
                        (e.target as HTMLInputElement).showPicker();
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 cursor-pointer ${
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
                disabled={submitting || uploadStatus === 'uploading'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]"
              >
                {submitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>{uploadStatus === 'uploading' ? 'Uploading Image...' : 'Creating Profile...'}</span></>
                ) : (
                  <><Heart className="h-5 w-5" /><span>Complete Patient Profile</span></>
                )}
              </button>
            </form>
          )}

          {!role && (
            <div className="text-center py-8 animate-in fade-in duration-300">
              <UserCheck className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Please select your role to continue
              </p>
            </div>
          )}

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg shadow-sm hover:shadow-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 dark:border-red-800/30"
            title="Sign out and switch accounts"
          >
            <span className="text-sm font-medium">Sign Out</span>
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </button>
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
