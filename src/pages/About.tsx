import React from 'react';
import { motion } from 'motion/react';
import { Shield, Target, Zap, Heart, Award, Users, Globe, Star } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-32 lg:py-48 border-b border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gray-50 -skew-x-12 translate-x-1/4 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block px-4 py-1 rounded-full bg-black text-white text-xs font-bold tracking-widest uppercase mb-8"
          >
            ESTABLISHED 2026
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl lg:text-9xl font-bold tracking-tighter mb-8 leading-none"
          >
            REDEFINING <br />
            <span className="text-gray-400">HUMAN POTENTIAL.</span>
          </motion.h1>
          <p className="text-xl lg:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            FitQuest is the world's most exclusive marketplace for elite performance coaching. 
            We bridge the gap between world-class expertise and dedicated athletes who demand the absolute best.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-5xl font-bold tracking-tight mb-12">The FitQuest Standard</h2>
              <div className="space-y-8">
                <p className="text-gray-600 text-xl leading-relaxed">
                  We believe that everyone deserves access to the highest level of coaching. 
                  Whether you're a professional athlete or a high-performing executive, 
                  the right guidance makes the difference between average and elite.
                </p>
                <p className="text-gray-600 text-xl leading-relaxed">
                  FitQuest was built to solve the fragmentation in the coaching industry. 
                  We vet every professional on our platform to ensure they meet our rigorous 
                  standards of excellence, certification, and proven results.
                </p>
                <div className="pt-8 grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-3xl font-bold mb-1">500+</h4>
                    <p className="text-gray-400 font-medium uppercase tracking-widest text-xs">Elite Coaches</p>
                  </div>
                  <div>
                    <h4 className="text-3xl font-bold mb-1">15k+</h4>
                    <p className="text-gray-400 font-medium uppercase tracking-widest text-xs">Success Stories</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 transform hover:-translate-y-2 transition-all duration-500">
                <Shield className="w-10 h-10 mb-6 text-black" />
                <h4 className="text-xl font-bold mb-3">Integrity</h4>
                <p className="text-gray-500 leading-relaxed">Uncompromising standards for our coaching community. We only accept the top 3% of applicants.</p>
              </div>
              <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 mt-12 transform hover:-translate-y-2 transition-all duration-500">
                <Target className="w-10 h-10 mb-6 text-black" />
                <h4 className="text-xl font-bold mb-3">Precision</h4>
                <p className="text-gray-500 leading-relaxed">Data-driven approaches to performance. Every session is optimized for your specific physiology.</p>
              </div>
              <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 transform hover:-translate-y-2 transition-all duration-500">
                <Zap className="w-10 h-10 mb-6 text-black" />
                <h4 className="text-xl font-bold mb-3">Speed</h4>
                <p className="text-gray-500 leading-relaxed">Efficient systems for booking and communication. Real-time access to world-class expertise.</p>
              </div>
              <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 mt-12 transform hover:-translate-y-2 transition-all duration-500">
                <Heart className="w-10 h-10 mb-6 text-black" />
                <h4 className="text-xl font-bold mb-3">Passion</h4>
                <p className="text-gray-500 leading-relaxed">Dedicated to the success of every athlete. Your goals are our mission, your progress is our reward.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team/Founder Quote */}
      <section className="py-32 bg-black text-white rounded-[60px] mx-4 mb-32 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-[120px]"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Star className="w-12 h-12 mx-auto mb-12 text-gray-400" />
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-12 leading-tight">
            "We didn't just build a marketplace. We built a gateway to the next version of yourself. 
            FitQuest is where discipline meets world-class strategy."
          </h2>
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-800"></div>
            <div className="text-left">
              <p className="font-bold text-xl">Alex Rivers</p>
              <p className="text-gray-400 uppercase tracking-widest text-xs font-bold">Founder & CEO, FitQuest</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
