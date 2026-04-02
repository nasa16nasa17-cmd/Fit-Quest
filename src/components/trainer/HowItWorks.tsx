import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, CheckCircle, Users, Award } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    { 
      icon: UserPlus, 
      title: '1. Create Your Profile', 
      description: 'Sign up and complete your professional profile. Showcase your expertise, certifications, and coaching philosophy.' 
    },
    { 
      icon: CheckCircle, 
      title: '2. Verification Process', 
      description: 'Our team reviews your credentials and experience to ensure the highest quality of coaching for our athletes.' 
    },
    { 
      icon: Users, 
      title: '3. Connect & Coach', 
      description: 'Set your rates, availability, and start receiving booking requests from athletes worldwide.' 
    },
    { 
      icon: Award, 
      title: '4. Get Paid Securely', 
      description: 'Payments are held securely and released to your wallet automatically after each successful session.' 
    },
  ];

  return (
    <section className="py-24 bg-white rounded-[60px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">The Path to Professional Coaching</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">Join our elite community of trainers and start growing your business today.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="w-16 h-16 bg-gray-50 text-black rounded-3xl flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-sm">
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 tracking-tight">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-[2px] bg-gray-100 -translate-x-8 z-0"></div>
              )}
            </motion.div>
          ))}
        </div>
        
        <div className="mt-20 p-10 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h4 className="text-xl font-bold mb-2">Ready to start your journey?</h4>
            <p className="text-gray-500 text-sm">Complete the application below and our team will get in touch with you within 24-48 hours.</p>
          </div>
          <div className="flex items-center space-x-4 text-sm font-bold uppercase tracking-widest text-gray-400">
            <span>Estimated time: 5 mins</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
