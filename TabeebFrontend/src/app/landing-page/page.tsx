'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  ArrowRight, BrainCircuit, ShieldCheck, UserCheck, HeartPulse,
  Stethoscope, ChevronRight, X, Mail, Phone, MapPin, MessageSquareQuote 
} from 'lucide-react';

// Animation variants for sections (use cubic-bezier array for type-safe easing)
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0, 0, 0.58, 1] as [number, number, number, number] }
  }
};

// Reusable component for animating sections on scroll
type AnimatedSectionProps = React.ComponentProps<typeof motion.section>;

const AnimatedSection = ({ children, className = '', ...rest }: AnimatedSectionProps) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.section
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={sectionVariants}
      className={className}
      {...rest}
    >
      {children}
    </motion.section>
  );
};


const LandingPage = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  // Close contact modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showContactModal && !target.closest('.contact-modal')) {
        setShowContactModal(false);
      }
    };
    if (showContactModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContactModal]);

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

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors font-medium">
                How It Works
              </a>
              <button 
                onClick={() => setShowContactModal(true)}
                className="text-slate-600 dark:text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors font-medium"
              >
                Contact
              </button>
            </nav>

            {/* CTA */}
            <Link 
              href="/auth"
              className="hidden md:inline-flex items-center bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 pt-20 pb-28">
        <div className="absolute inset-0 bg-grid-slate-200/[0.05] dark:bg-grid-slate-700/[0.1] [mask-image:linear-gradient(to_bottom,white_5%,transparent_90%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                Your Complete Healthcare
                <span className="block bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                  Powered by AI
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-xl">
                TABEEB is a comprehensive health application — book appointments and video visits, get e‑prescriptions, manage medical records, track lab tests, and receive smart reminders — all powered by AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/auth"
                  className="z-10 group inline-flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-teal-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Start Consultation
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative hidden lg:block"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute -inset-2 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl opacity-20 blur-2xl"></div>
              <div className="relative h-96 w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                 {/* You can replace this with a dynamic visual or illustration */}
                 <Image src="/visual2.webp" alt="AI Healthcare Illustration" fill sizes="(min-width: 1024px) 50vw, 100vw" className="p-8 object-contain"/>
                 <span className="text-slate-400 dark:text-slate-500">Your awesome visual here</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <AnimatedSection id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Healthcare in 3 Simple Steps
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get from symptoms to solution quickly and efficiently with our streamlined process.
            </p>
          </div>
          <div className="relative grid md:grid-cols-3 gap-8 text-center">
            {/* Dashed line for desktop */}
            <div className="hidden md:block absolute top-1/2 -translate-y-12 left-0 w-full">
              <svg width="100%" height="2" className="stroke-slate-300 dark:stroke-slate-700">
                <line x1="0" y1="1" x2="100%" y2="1" strokeWidth="2" strokeDasharray="8 8" />
              </svg>
            </div>
            
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 mb-4 bg-white dark:bg-slate-800 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-500 z-10">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Describe Symptoms</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Tell our AI about your symptoms in simple language through our secure chat.
              </p>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 mb-4 bg-white dark:bg-slate-800 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-500 z-10">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get AI Analysis</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Receive an instant, data-driven analysis of potential conditions and next steps.
              </p>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 mb-4 bg-white dark:bg-slate-800 rounded-full border-2 border-teal-500 flex items-center justify-center text-teal-500 z-10">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Care, End‑to‑End</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Book appointments or video visits, get e‑prescriptions, and manage lab tests and health records — all in one place.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>
      
      {/* Features Section */}
      <AnimatedSection id="features" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              A Comprehensive Health Application
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our platform is packed with features designed for your well-being and convenience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BrainCircuit, title: 'AI‑Powered Diagnosis', text: 'Advanced algorithms analyze symptoms and guide next steps throughout your care journey.' },
              { icon: ShieldCheck, title: 'Secure Digital Records', text: 'All your prescriptions, reports, and visits securely stored and easily accessible.' },
              { icon: Stethoscope, title: 'Video Visits & Appointments', text: 'Book appointments, join video calls, and manage follow‑ups without the wait.' },
              { icon: HeartPulse, title: 'Smart Insights & Reminders', text: 'Medication, appointment, and follow‑up reminders tailored to your plan.' },
              { icon: UserCheck, title: 'Expert Doctor Network', text: 'Connect with certified doctors and specialists across Pakistan, anytime.' },
              { icon: MessageSquareQuote, title: 'E‑Prescriptions & Lab Tests', text: 'Digital prescriptions and integrated lab tracking to streamline your treatment.' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="group relative p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-teal-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>
      
      {/* Testimonials Section */}
      <AnimatedSection className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Trusted by Patients Across Pakistan
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Hear what our users have to say about their experience with TABEEB.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Testimonial Card */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 mb-6">"TABEEB was a lifesaver when my child had a fever late at night. The AI gave me clear instructions and peace of mind instantly."</p>
              <div className="flex items-center">
                <Image src="/avatar1.webp" alt="User" width={40} height={40} className="rounded-full" />
                <div className="ml-4">
                  <p className="font-semibold text-slate-900 dark:text-white">Aisha Khan</p>
                  <p className="text-sm text-slate-500">Karachi</p>
                </div>
              </div>
            </div>
             {/* Testimonial Card */}
             <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 mb-6">"As a busy professional, I don't have time for long clinic waits. This app lets me consult with a doctor from my office. Highly recommended!"</p>
              <div className="flex items-center">
                <Image src="/avatar1.webp" alt="User" width={40} height={40} className="rounded-full" />
                <div className="ml-4">
                  <p className="font-semibold text-slate-900 dark:text-white">Bilal Ahmed</p>
                  <p className="text-sm text-slate-500">Lahore</p>
                </div>
              </div>
            </div>
             {/* Testimonial Card */}
             <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 mb-6">"Finally, a healthcare solution that understands our needs. The medicine finder helped me save a lot on my monthly prescriptions."</p>
              <div className="flex items-center">
                <Image src="/avatar1.webp" alt="User" width={40} height={40} className="rounded-full" />
                <div className="ml-4">
                  <p className="font-semibold text-slate-900 dark:text-white">Fatima Raza</p>
                  <p className="text-sm text-slate-500">Islamabad</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-cyan-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Join thousands of users who trust TABEEB. Get started today for a smarter healthcare experience.
          </p>
          <Link 
            href="/auth"
            className="inline-flex items-center justify-center bg-white text-teal-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image src="/tabeeb_logo.png" alt="TABEEB Logo" width={48} height={48} className="bg-white rounded-lg p-1"/>
                <span className="text-2xl font-bold text-white">TABEEB</span>
              </div>
              <p className="max-w-md">Transforming healthcare in Pakistan through AI, making quality medical care accessible and affordable for everyone.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">AI Consultation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Health Records</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Doctor Network</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
                  </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/admin/login" className="hover:text-white transition-colors">Admin Panel</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} TABEEB. All rights reserved. Made with ❤️ for Pakistan's healthcare.</p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="contact-modal bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
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
              {[
                { icon: Mail, title: 'Email', value: 'support@tabeeb.com', color: 'teal' },
                { icon: Phone, title: 'Phone', value: '+92 300 1234567', color: 'green' },
                { icon: MapPin, title: 'Location', value: 'Karachi, Pakistan', color: 'orange' }
              ].map(item => (
                <div key={item.title} className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-lg flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-slate-600 dark:text-slate-300">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  We're here to help! Reach out for any questions or support.
                </p>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;