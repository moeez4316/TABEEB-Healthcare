'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, Lock, Eye, FileText, 
  AlertCircle, Database, UserCheck, Bell 
} from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Image
                  src="/tabeeb_logo.png"
                  alt="TABEEB Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  TABEEB
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">Comprehensive Health Application</p>
              </div>
            </Link>

            {/* Back Button */}
            <Link 
              href="/"
              className="inline-flex items-center text-slate-600 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors font-medium"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Your privacy and data security are our top priorities at TABEEB
            </p>
            <p className="text-sm text-teal-200 mt-4">
              Last Updated: October 21, 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Development Notice Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 border-b-4 border-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            className="flex items-start space-x-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex-shrink-0">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Development & Testing Notice
              </h3>
              <p className="text-white/95 leading-relaxed">
                <strong>Important:</strong> TABEEB is currently in active development and testing phase. 
                The production environment is being used for internal testing over our network. 
                All advertised features are being built with care for the people of Pakistan and will 
                be made publicly available once development and testing are complete. We appreciate 
                your patience as we work to deliver a safe, secure, and comprehensive healthcare solution.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          className="space-y-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Introduction */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-6 h-6 text-teal-500 mr-3" />
              Introduction
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Welcome to TABEEB (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our comprehensive health 
                application and related services. We are committed to protecting your privacy and ensuring 
                the security of your personal and medical information.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                By using TABEEB, you agree to the collection and use of information in accordance with 
                this policy. If you do not agree with our policies and practices, please do not use our services.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
              <Database className="w-6 h-6 text-teal-500 mr-3" />
              Information We Collect
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  1. Personal Information
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                  <li>Name, email address, phone number, and date of birth</li>
                  <li>National ID (CNIC) for identity verification (doctors and patients)</li>
                  <li>Profile information and photographs</li>
                  <li>Payment and billing information</li>
                  <li>Emergency contact details</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  2. Health Information
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                  <li>Medical history, symptoms, and health conditions</li>
                  <li>Prescriptions, medications, and treatment plans</li>
                  <li>Lab test results and medical reports</li>
                  <li>Doctor consultations and appointment records</li>
                  <li>Health tracking data (vitals, reminders, progress)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  3. Professional Information (For Healthcare Providers)
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                  <li>Medical license and certifications (PMC registration)</li>
                  <li>Specialization, qualifications, and experience</li>
                  <li>Clinic/hospital affiliations and practice details</li>
                  <li>Verification documents and professional credentials</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  4. Technical Information
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                  <li>Device information, IP address, and browser type</li>
                  <li>Usage data, log files, and analytics</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Video call metadata (duration, participants, connection quality)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
              <UserCheck className="w-6 h-6 text-teal-500 mr-3" />
              How We Use Your Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mt-1">
                  <span className="text-teal-600 dark:text-teal-400 text-sm font-semibold">✓</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Provide Healthcare Services:</strong> Enable AI-powered diagnosis, appointment booking, 
                  video consultations, e-prescriptions, and health tracking features.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mt-1">
                  <span className="text-teal-600 dark:text-teal-400 text-sm font-semibold">✓</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Verify Healthcare Professionals:</strong> Authenticate doctors and ensure only 
                  licensed medical practitioners provide consultations.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mt-1">
                  <span className="text-teal-600 dark:text-teal-400 text-sm font-semibold">✓</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Improve AI Algorithms:</strong> Train and refine our AI models to provide better 
                  diagnosis support and health recommendations.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mt-1">
                  <span className="text-teal-600 dark:text-teal-400 text-sm font-semibold">✓</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Send Notifications:</strong> Deliver appointment reminders, medication alerts, 
                  and health tips via email, SMS, or in-app notifications.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mt-1">
                  <span className="text-teal-600 dark:text-teal-400 text-sm font-semibold">✓</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Process Payments:</strong> Handle billing and payment transactions securely for 
                  consultations and services.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mt-1">
                  <span className="text-teal-600 dark:text-teal-400 text-sm font-semibold">✓</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Ensure Safety & Compliance:</strong> Prevent fraud, ensure HIPAA-equivalent standards, 
                  and comply with Pakistani healthcare regulations.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
              <Lock className="w-6 h-6 text-teal-500 mr-3" />
              Data Security & Protection
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">🔐 Encryption</h4>
                  <p className="text-sm">All data is encrypted in transit (TLS/SSL) and at rest using AES-256 encryption.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">🔒 Access Controls</h4>
                  <p className="text-sm">Role-based access ensures only authorized personnel can access sensitive data.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">🛡️ Secure Authentication</h4>
                  <p className="text-sm">Firebase Authentication with multi-factor authentication (MFA) support.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">📊 Regular Audits</h4>
                  <p className="text-sm">Periodic security audits and vulnerability assessments to ensure data safety.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
              <Eye className="w-6 h-6 text-teal-500 mr-3" />
              Data Sharing & Disclosure
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                We do not sell your personal or health information. We may share data only in these circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>With Healthcare Providers:</strong> To facilitate consultations, prescriptions, and continuity of care.</li>
                <li><strong>With Service Providers:</strong> Trusted third parties (payment processors, cloud storage, analytics) under strict confidentiality agreements.</li>
                <li><strong>For Legal Compliance:</strong> When required by law, court orders, or to protect rights and safety.</li>
                <li><strong>With Your Consent:</strong> Any other sharing will be done only with your explicit permission.</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
              <Bell className="w-6 h-6 text-teal-500 mr-3" />
              Your Privacy Rights
            </h2>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                You have the following rights regarding your personal data:
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-teal-500 font-bold">•</span>
                  <p className="text-slate-600 dark:text-slate-400"><strong>Access:</strong> Request a copy of your personal and health data.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-teal-500 font-bold">•</span>
                  <p className="text-slate-600 dark:text-slate-400"><strong>Correction:</strong> Update or correct inaccurate information.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-teal-500 font-bold">•</span>
                  <p className="text-slate-600 dark:text-slate-400"><strong>Deletion:</strong> Request deletion of your account and associated data (subject to legal retention requirements).</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-teal-500 font-bold">•</span>
                  <p className="text-slate-600 dark:text-slate-400"><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-teal-500 font-bold">•</span>
                  <p className="text-slate-600 dark:text-slate-400"><strong>Opt-Out:</strong> Unsubscribe from marketing communications or non-essential notifications.</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:privacy@tabeeb.com" className="text-teal-500 hover:text-teal-600 underline">privacy@tabeeb.com</a>.
              </p>
            </div>
          </section>

          {/* Cookies & Tracking */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Cookies & Tracking Technologies
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We use cookies and similar technologies to enhance user experience, analyze usage patterns, 
              and personalize content. You can manage cookie preferences through your browser settings. 
              Note that disabling cookies may affect certain features of the application.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              TABEEB is not intended for users under the age of 13 without parental consent. We do not 
              knowingly collect personal information from children. If you are a parent or guardian and 
              believe your child has provided us with personal data, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Changes to This Privacy Policy
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or 
              legal requirements. We will notify you of any significant changes via email or in-app notification. 
              Your continued use of TABEEB after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Contact Us
            </h2>
            <p className="mb-6 text-teal-50">
              If you have any questions, concerns, or requests regarding this Privacy Policy or how we 
              handle your data, please reach out to us:
            </p>
            <div className="space-y-3 text-teal-50">
              <p><strong>Email:</strong> <a href="mailto:privacy@tabeeb.com" className="underline hover:text-white">privacy@tabeeb.com</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@tabeeb.com" className="underline hover:text-white">support@tabeeb.com</a></p>
              <p><strong>Address:</strong> Karachi, Pakistan</p>
            </div>
          </section>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Image src="/tabeeb_logo.png" alt="TABEEB Logo" width={40} height={40} className="bg-white rounded-lg p-1"/>
              <span className="text-xl font-bold text-white">TABEEB</span>
            </div>
            <p className="text-sm text-center">
              © {new Date().getFullYear()} TABEEB. All rights reserved. Made with ❤️ for Pakistan&apos;s healthcare.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
