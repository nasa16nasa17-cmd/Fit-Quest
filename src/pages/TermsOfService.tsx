import React from 'react';
import { motion } from 'motion/react';
import { Shield, Scale, FileText, Lock, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
  const sections = [
    {
      icon: Shield,
      title: "1. Acceptance of Terms",
      content: "By accessing and using FITQUEST, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all visitors, users, and others who access or use the service."
    },
    {
      icon: FileText,
      title: "2. User Accounts",
      content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the terms, which may result in immediate termination of your account on our service."
    },
    {
      icon: Scale,
      title: "3. Trainer & Athlete Relationship",
      content: "FITQUEST is a marketplace that connects athletes with trainers. While we vet our trainers, the actual coaching relationship is between the trainer and the athlete. FITQUEST is not responsible for the specific advice or results of individual coaching sessions."
    },
    {
      icon: Lock,
      title: "4. Payments & Refunds",
      content: "Payments for sessions are processed through our secure payment provider. Funds are held and released to trainers upon successful completion of sessions. Refund requests must be submitted within 24 hours of the scheduled session time and are subject to our refund policy."
    },
    {
      icon: AlertCircle,
      title: "5. Limitation of Liability",
      content: "In no event shall FITQUEST, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses."
    }
  ];

  return (
    <div className="bg-white min-h-screen py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-3xl mb-8"
          >
            <Shield className="w-8 h-8 text-black" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight"
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500"
          >
            Last updated: April 1, 2026
          </motion.p>
        </div>

        <div className="space-y-12">
          {sections.map((section, index) => (
            <motion.section 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 p-10 rounded-[40px] border border-gray-100"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <section.icon className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        <div className="mt-24 p-12 bg-black text-white rounded-[40px] text-center">
          <h3 className="text-2xl font-bold mb-4">Questions about our terms?</h3>
          <p className="text-gray-400 mb-8">If you have any questions about these Terms, please contact us.</p>
          <button className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-all">
            Contact Legal Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
