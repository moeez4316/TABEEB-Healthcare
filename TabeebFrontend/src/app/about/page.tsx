'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Heart, Target, Users, Zap, Award, 
  Globe, TrendingUp, Shield, Sparkles, CheckCircle2 
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/config/appConfig';

const AboutPage = () => {
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
                  src={APP_CONFIG.ASSETS.LOGO}
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
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-500 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Heart className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              About TABEEB
            </h1>
            <p className="text-xl text-teal-100 max-w-2xl mx-auto">
              Transforming healthcare in Pakistan through AI and innovation
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          className="space-y-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Our Story */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-6">
              <Sparkles className="w-8 h-8 text-teal-500 mr-3" />
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Story</h2>
            </div>
            <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
              <p>
                TABEEB was born from a simple yet powerful vision: to make quality healthcare accessible 
                to every Pakistani, regardless of their location or economic status. In a country where 
                millions struggle to access timely medical care, we saw an opportunity to leverage technology 
                and artificial intelligence to bridge the gap.
              </p>
              <p>
                Our journey began with a team of passionate healthcare professionals, software engineers, 
                and AI specialists who shared a common goal — to revolutionize how Pakistanis interact 
                with healthcare services. We recognized that traditional healthcare systems often create 
                barriers: long wait times, geographical limitations, and limited access to specialists.
              </p>
              <p>
                Today, TABEEB is building a comprehensive health application that combines AI-powered 
                diagnosis, video consultations, digital prescriptions, health record management, and 
                smart reminders — all in one secure, user-friendly platform designed specifically for 
                the Pakistani healthcare landscape.
              </p>
            </div>
          </section>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <motion.div 
              className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-8 text-white shadow-lg"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <Target className="w-8 h-8 mr-3" />
                <h3 className="text-2xl font-bold">Our Mission</h3>
              </div>
              <p className="text-teal-50 leading-relaxed">
                To democratize healthcare access in Pakistan by providing an AI-powered, comprehensive 
                health platform that connects patients with quality medical care, empowers informed 
                health decisions, and reduces barriers to treatment — making healthcare affordable, 
                accessible, and efficient for everyone.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-teal-500 shadow-lg"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <Globe className="w-8 h-8 text-teal-500 mr-3" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Vision</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                To become Pakistan&apos;s leading digital health platform, setting the standard for AI-driven 
                healthcare innovation. We envision a future where every Pakistani has instant access to 
                medical guidance, trusted healthcare professionals, and comprehensive health management 
                tools at their fingertips.
              </p>
            </motion.div>
          </div>

          {/* Core Values */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-8">
              <Award className="w-8 h-8 text-teal-500 mr-3" />
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Core Values</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Shield,
                  title: 'Trust & Security',
                  description: 'Your health data is sacred. We implement bank-level encryption and never compromise on privacy.'
                },
                {
                  icon: Heart,
                  title: 'Patient-First Approach',
                  description: 'Every decision we make prioritizes patient well-being, safety, and satisfaction.'
                },
                {
                  icon: Zap,
                  title: 'Innovation',
                  description: 'We continuously push boundaries with cutting-edge AI and technology to improve healthcare delivery.'
                },
                {
                  icon: Users,
                  title: 'Accessibility',
                  description: 'Healthcare is a right, not a privilege. We work tirelessly to make quality care available to all.'
                }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-4 p-6 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {value.title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* What We Offer */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-8">
              <CheckCircle2 className="w-8 h-8 text-teal-500 mr-3" />
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">What We Offer</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'AI-powered symptom analysis and preliminary diagnosis',
                'Video consultations with certified doctors and specialists',
                'Digital prescriptions and medication management',
                'Comprehensive health record storage and management',
                'Lab test tracking and results integration',
                'Smart appointment and medication reminders',
                'Verified doctor network across Pakistan',
                '24/7 AI health support and guidance'
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{feature}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Development Status */}
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-8 md:p-12 border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-8 h-8 text-amber-600 dark:text-amber-400 mr-3" />
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Current Development Status</h2>
            </div>
            <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                <strong className="text-amber-700 dark:text-amber-400">We&apos;re building something special for Pakistan.</strong> 
                TABEEB is currently in active development, with our team working around the clock to ensure 
                every feature meets the highest standards of quality, security, and user experience.
              </p>
              <p>
                Our production environment is being used for rigorous internal testing over our network. 
                This allows us to identify and resolve any issues before making the platform publicly available. 
                We&apos;re committed to launching a product that Pakistanis can trust with their health.
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mt-6 border border-amber-200 dark:border-amber-700">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                  <Sparkles className="w-5 h-5 text-teal-500 mr-2" />
                  What&apos;s Coming Soon
                </h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    <span>Full public launch with all advertised features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    <span>Expanded doctor network covering all major cities</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    <span>Mobile apps for iOS and Android</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    <span>Integration with major hospitals and labs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    <span>Urdu language support for better accessibility</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Why Choose TABEEB */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              Why Choose TABEEB?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Built for Pakistan',
                  description: 'Designed specifically for Pakistani healthcare needs, cultural context, and local challenges.',
                  gradient: 'from-teal-500 to-cyan-500'
                },
                {
                  title: 'AI + Human Care',
                  description: 'Combines cutting-edge AI technology with real, certified healthcare professionals for the best outcomes.',
                  gradient: 'from-cyan-500 to-blue-500'
                },
                {
                  title: 'All-in-One Platform',
                  description: 'Everything from diagnosis to prescription to follow-up care — all in a single, integrated application.',
                  gradient: 'from-blue-500 to-purple-500'
                }
              ].map((reason, index) => (
                <motion.div
                  key={index}
                  className="relative overflow-hidden rounded-xl p-6 text-white"
                  style={{
                    background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${reason.gradient} opacity-90`}></div>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-3">{reason.title}</h4>
                    <p className="text-white/90 text-sm leading-relaxed">{reason.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Join Us on This Journey</h2>
            <p className="text-teal-50 text-lg mb-8 max-w-2xl mx-auto">
              We&apos;re building TABEEB with the people of Pakistan in mind. Have questions, suggestions, 
              or want to be part of our mission? We&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-white text-teal-600 px-8 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-all duration-300 shadow-lg"
              >
                Explore Features
              </Link>
              <button
                onClick={() => window.location.href = 'mailto:support@tabeeb.com'}
                className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white border-2 border-white px-8 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300"
              >
                Contact Us
              </button>
            </div>
          </section>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Image src={APP_CONFIG.ASSETS.LOGO} alt="TABEEB Logo" width={40} height={40} className="bg-white rounded-lg p-1"/>
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

export default AboutPage;
