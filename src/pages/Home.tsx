import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Shield, Zap, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const Home = () => {
  const categories = [
    { name: 'Personal Training', icon: '🏋️‍♂️' },
    { name: 'Yoga & Pilates', icon: '🧘‍♀️' },
    { name: 'Boxing & MMA', icon: '🥊' },
    { name: 'Nutrition', icon: '🥗' },
    { name: 'Sport Specific', icon: '⚽' },
    { name: 'Rehab & Mobility', icon: '🩹' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:w-2/3">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[60px] font-bold tracking-tighter leading-none mb-8"
            >
              ELITE COACHING <br />
              <span className="text-gray-400">FOR PEAK HUMAN</span> <br />
              PERFORMANCE.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-500 max-w-xl mb-12"
            >
              Connect with the world's most qualified fitness professionals. 
              Personalized training, nutrition, and mindset coaching at your fingertips.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <Link to="/browse" className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all flex items-center justify-center">
                Find your coach <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/apply" className="border border-black text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center">
                Join as a trainer
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
          <div className="w-full h-full bg-gray-50 rounded-bl-[200px] overflow-hidden">
             <img 
              src="https://picsum.photos/seed/fitness/1200/1600" 
              alt="Elite Training" 
              className="w-full h-full object-cover grayscale opacity-80"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">Categories</h2>
              <h3 className="text-4xl font-bold tracking-tight">Expertise for every goal</h3>
            </div>
            <Link to="/browse" className="text-black font-medium hover:underline flex items-center">
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 border border-gray-100 rounded-3xl hover:border-black transition-all cursor-pointer group"
              >
                <div className="text-4xl mb-4">{cat.icon}</div>
                <h4 className="font-semibold text-sm group-hover:text-black">{cat.name}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-16">
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Vetted Professionals</h3>
              <p className="text-gray-400">Every coach on FitQuest undergoes a rigorous background and certification check to ensure elite quality.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Seamless Booking</h3>
              <p className="text-gray-400">Schedule sessions, manage payments, and communicate with your coach all in one integrated platform.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Global Community</h3>
              <p className="text-gray-400">Access world-class expertise regardless of your location. Train online or find local experts near you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trainers */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">Featured</h2>
            <h3 className="text-4xl font-bold tracking-tight">Learn from the best</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[40px] overflow-hidden border border-gray-100 group cursor-pointer shadow-sm hover:shadow-xl transition-all">
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/trainer${i}/800/1000`} 
                    alt="Trainer" 
                    className="w-full h-full object-cover grayscale group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Elite Coach
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold">Alex Rivera</h4>
                    <div className="flex items-center text-sm font-bold">
                      <Star className="w-4 h-4 fill-black mr-1" /> 4.9
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-6">Strength & Conditioning • 12 years exp.</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">$85<span className="text-gray-400 text-sm font-normal">/session</span></span>
                    <Link to="/browse" className="text-black font-bold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                      View Profile <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black rounded-[60px] p-12 lg:p-24 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tighter mb-8">READY TO TRANSFORM?</h2>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-12">
                Join thousands of athletes and fitness enthusiasts who have found their perfect coach on FitQuest.
              </p>
              <Link to="/signup" className="bg-white text-black px-12 py-6 rounded-full text-xl font-bold hover:bg-gray-100 transition-all inline-block">
                Start your journey today
              </Link>
            </div>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-500 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
