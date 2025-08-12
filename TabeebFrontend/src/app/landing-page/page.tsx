'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Brain, 
  Clock, 
  Shield, 
  Users, 
  Activity,
  Stethoscope,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const LandingPage = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  // Close contact modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showContactModal && !target.closest('.contact-modal') && !target.closest('button')) {
        setShowContactModal(false);
      }
    };

    if (showContactModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContactModal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                <Image
                  src="/tabeeb_logo.png"
                  alt="TABEEB Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                  TABEEB
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI Healthcare</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Features
              </a>
              <a href="#about" className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                About
              </a>
              <button 
                onClick={() => setShowContactModal(true)}
                className="text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                Contact
              </button>
            </nav>

            {/* Mobile menu and CTA */}
            <div className="flex items-center space-x-3 md:hidden">
              <Link 
                href="/auth"
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm cursor-pointer z-10 relative"
                style={{ pointerEvents: 'auto' }}
              >
                Get Started
              </Link>
            </div>

            {/* Desktop CTA */}
            <Link 
              href="/auth"
              className="hidden md:block bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2.5 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium cursor-pointer z-10 relative"
              style={{ pointerEvents: 'auto' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 dark:from-teal-900/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700">
                <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400 mr-2" />
                <span className="text-sm font-medium text-teal-700 dark:text-teal-300">AI-Powered Healthcare Platform</span>
              </div>
            </div>

            {/* Main heading with proper text clipping */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
              Transform Healthcare with
              <span className="block bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              TABEEB brings revolutionary AI-driven telehealth services to Pakistan, offering instant medical consultation, smart diagnosis support, and affordable healthcare solutions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/auth"
                className="group bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center cursor-pointer z-10 relative"
                style={{ pointerEvents: 'auto' }}
              >
                Start Your Consultation
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => setShowContactModal(true)}
                className="group border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-400 transition-all duration-200 flex items-center cursor-pointer z-10 relative"
                style={{ pointerEvents: 'auto' }}
              >
                Contact Us
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">10K+</div>
                <div className="text-slate-600 dark:text-slate-400">Consultations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">95%</div>
                <div className="text-slate-600 dark:text-slate-400">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">24/7</div>
                <div className="text-slate-600 dark:text-slate-400">Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Why Choose TABEEB?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Experience the future of healthcare with our AI-powered platform designed specifically for Pakistan&apos;s healthcare needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">AI-Powered Diagnosis</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Advanced machine learning algorithms analyze symptoms and medical history to provide accurate preliminary diagnoses and treatment recommendations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Instant Consultation</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Get immediate medical guidance without waiting times. Our AI chatbot provides 24/7 support for non-emergency medical questions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Affordable Medicine</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Find the best prices for medicines across Pakistan with our comprehensive database of local pharmacies and generic alternatives.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Expert Network</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Connect with certified doctors and specialists across Pakistan for professional medical consultations and second opinions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Health Monitoring</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Track your health metrics, medication schedules, and get personalized health insights based on your medical history.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Stethoscope className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Digital Records</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Secure, digital health records that you can access anytime, anywhere. Share with doctors instantly for better care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">About TABEEB</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              TABEEB is Pakistan&apos;s first AI-powered healthcare platform, designed to make quality medical care accessible to everyone. Our mission is to bridge the gap between patients and healthcare providers through innovative technology.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-3xl mx-auto">
            Join thousands of users who trust TABEEB for their medical consultation needs. Experience the future of healthcare today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth"
              className="bg-white text-teal-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-teal-50 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer z-10 relative"
              style={{ pointerEvents: 'auto' }}
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white dark:bg-slate-800 border border-slate-700 dark:border-slate-600">
                  <Image
                    src="/tabeeb_logo.png"
                    alt="TABEEB Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="text-2xl font-bold">TABEEB</span>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">AI Healthcare Platform</p>
                </div>
              </div>
              <p className="text-slate-400 dark:text-slate-500 mb-6 max-w-md">
                Transforming healthcare in Pakistan through AI-powered solutions, making quality medical care accessible to everyone.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-800 dark:bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                  <span className="text-teal-400">f</span>
                </div>
                <div className="w-10 h-10 bg-slate-800 dark:bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                  <span className="text-teal-400">t</span>
                </div>
                <div className="w-10 h-10 bg-slate-800 dark:bg-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                  <span className="text-teal-400">in</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-slate-400 dark:text-slate-500">
                <li><a href="#" className="hover:text-white transition-colors">AI Consultation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Medicine Search</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Health Records</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Doctor Network</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400 dark:text-slate-500">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li>
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <Link 
                    href="/admin/login"
                    className="hover:text-white transition-colors flex items-center space-x-1 group"
                  >
                    <span>Admin Panel</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 dark:border-slate-700 mt-8 pt-8 text-center">
            <p className="text-slate-400 dark:text-slate-500">
              © 2025 TABEEB. All rights reserved. Made with ❤️ for Pakistan&apos;s healthcare.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="contact-modal bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Contact Us</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Email</p>
                  <p className="text-slate-600 dark:text-slate-300">support@tabeeb.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Phone</p>
                  <p className="text-slate-600 dark:text-slate-300">+92 300 1234567</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Location</p>
                  <p className="text-slate-600 dark:text-slate-300">Karachi, Pakistan</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-600">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  We&apos;re here to help! Reach out to us for any questions or support.
                </p>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
