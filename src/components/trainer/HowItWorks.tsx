import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, CheckCircle, Users } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    { icon: UserPlus, title: 'Apply', description: 'Fill out our trainer application form with your credentials and experience.' },
    { icon: CheckCircle, title: 'Get Verified', description: 'Our team reviews your application and verifies your certifications.' },
    { icon: Users, title: 'Start Coaching', description: 'Once approved, set up your profile and start connecting with athletes.' },
  ];

  return (
    <section className="py-20 bg-gray-50 rounded-[40px]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-16">How to become a trainer</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm"
            >
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6">
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">{step.title}</h3>
              <p className="text-gray-500">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
