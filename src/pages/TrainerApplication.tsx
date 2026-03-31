import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ArrowRight, ArrowLeft, Upload, Award, Globe, MapPin, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const TrainerApplication = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Taxonomy states
  const [categories, setCategories] = useState<any[]>([]);
  const [specializationsList, setSpecializationsList] = useState<any[]>([]);
  const [languagesList, setLanguagesList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    sport: '',
    experience: 0,
    location: '',
    isOnline: true,
    isInPerson: false,
    bio: '',
    philosophy: '',
    sessionPrice: 0,
    monthlyPlanPrice: 0,
    specializations: [] as string[],
    languages: ['English'],
  });

  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const [catSnap, specSnap, langSnap] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'specializations')),
          getDocs(collection(db, 'languages'))
        ]);

        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSpecializationsList(specSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLanguagesList(langSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching taxonomies:", error);
      } finally {
        setFetchingData(false);
      }
    };
    fetchTaxonomies();
  }, []);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const toggleSelection = (field: 'specializations' | 'languages', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) {
      console.log("No user found, returning");
      return;
    }
    console.log("Submitting application for user:", user.uid);
    setLoading(true);
    setError(null);
    try {
      const trainerId = user.uid;
      const trainerData = {
        ...formData,
        userId: user.uid,
        experience: Number(formData.experience),
        sessionPrice: Number(formData.sessionPrice),
        monthlyPlanPrice: Number(formData.monthlyPlanPrice),
        rating: 5.0,
        reviewCount: 0,
        sessionsCompleted: 0,
        responseTime: '< 1 hour',
        isApproved: false,
        isVerified: false,
        isFeatured: false,
      };

      console.log("Sending request to /api/trainers/apply");
      const response = await fetch('/api/trainers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: trainerId,
          trainerData,
          userEmail: user.email,
          userName: profile?.displayName || user.displayName,
        }),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error data from server:", errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to submit application');
      }
      
      console.log("Submission successful, setting step to 4");
      setStep(4); // Success step
    } catch (error: any) {
      console.error("Error submitting application:", error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to apply</h2>
          <button onClick={() => navigate('/login')} className="bg-black text-white px-8 py-3 rounded-full font-bold">Log In</button>
        </div>
      </div>
    );
  }

  if (fetchingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-gray-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        {step < 4 && (
          <div className="mb-12">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Step {step} of 3</span>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{Math.round((step/3)*100)}% Complete</span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step/3)*100}%` }}
                className="h-full bg-black"
              ></motion.div>
            </div>
            
            {error && (
              <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[40px] p-8 lg:p-12 shadow-xl border border-gray-100"
            >
              <h2 className="text-3xl font-bold tracking-tight mb-8">Professional Details</h2>
              
              {categories.length === 0 && !fetchingData && (
                <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-start space-x-4 mb-8">
                  <AlertCircle className="w-6 h-6 text-orange-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-orange-900">No categories found</h4>
                    <p className="text-sm text-orange-700/70 font-medium">
                      The platform administrator hasn't defined any sports categories yet. Please contact support or try again later.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Primary Sport / Category</label>
                  <select 
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none font-bold"
                    value={formData.sport}
                    onChange={(e) => setFormData({...formData, sport: e.target.value})}
                  >
                    <option value="">Select a sport...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Years of Experience</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location (City, Country)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="e.g. London, UK"
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black mr-3"
                      checked={formData.isOnline}
                      onChange={(e) => setFormData({...formData, isOnline: e.target.checked})}
                    />
                    <span className="text-sm font-medium">Online Coaching</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black mr-3"
                      checked={formData.isInPerson}
                      onChange={(e) => setFormData({...formData, isInPerson: e.target.checked})}
                    />
                    <span className="text-sm font-medium">In-Person Training</span>
                  </label>
                </div>
              </div>
              <button 
                onClick={handleNext}
                disabled={!formData.sport || !formData.location}
                className="w-full mt-10 py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50"
              >
                Next Step <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[40px] p-8 lg:p-12 shadow-xl border border-gray-100"
            >
              <h2 className="text-3xl font-bold tracking-tight mb-8">Bio & Philosophy</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">About You (Bio)</label>
                  <textarea 
                    rows={4}
                    placeholder="Tell potential clients about your background and expertise..."
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none resize-none"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Coaching Philosophy</label>
                  <textarea 
                    rows={3}
                    placeholder="What is your approach to training and performance?"
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none resize-none"
                    value={formData.philosophy}
                    onChange={(e) => setFormData({...formData, philosophy: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4">Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {specializationsList.map(spec => (
                      <button
                        key={spec.id}
                        onClick={() => toggleSelection('specializations', spec.name)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          formData.specializations.includes(spec.name)
                          ? 'bg-black text-white shadow-lg'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {spec.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {languagesList.map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => toggleSelection('languages', lang.name)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          formData.languages.includes(lang.name)
                          ? 'bg-black text-white shadow-lg'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-4 mt-10">
                <button 
                  onClick={handleBack}
                  className="flex-1 py-5 border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  <ArrowLeft className="mr-2 w-5 h-5" /> Back
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center"
                >
                  Next Step <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[40px] p-8 lg:p-12 shadow-xl border border-gray-100"
            >
              <h2 className="text-3xl font-bold tracking-tight mb-8">Pricing & Finalize</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Single Session Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="number" 
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                      value={formData.sessionPrice}
                      onChange={(e) => setFormData({...formData, sessionPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Plan Price (Optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="number" 
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                      value={formData.monthlyPlanPrice}
                      onChange={(e) => setFormData({...formData, monthlyPlanPrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="flex items-start">
                    <Award className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                    <p className="text-sm text-blue-800">
                      By submitting, you agree to our trainer terms. Your profile will be reviewed by our team within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4 mt-10">
                <button 
                  onClick={handleBack}
                  className="flex-1 py-5 border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center"
                >
                  <ArrowLeft className="mr-2 w-5 h-5" /> Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] p-12 lg:p-20 shadow-xl border border-gray-100 text-center"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">Application Received!</h2>
              <p className="text-gray-500 text-lg mb-12">
                Thank you for applying to be a FitQuest coach. Our team will review your profile and get back to you shortly.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-black text-white px-12 py-5 rounded-full font-bold hover:bg-gray-800 transition-all"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrainerApplication;
