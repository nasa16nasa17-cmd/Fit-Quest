import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { TrainerProfile } from '../types';
import { Save, ArrowLeft, Video, Info, DollarSign, MapPin, Globe } from 'lucide-react';
import { motion } from 'motion/react';

const TrainerSettings = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainerData, setTrainerData] = useState<Partial<TrainerProfile>>({});

  useEffect(() => {
    const fetchTrainerData = async () => {
      if (!user) return;
      try {
        const trainerDoc = await getDoc(doc(db, 'trainers', user.uid));
        if (trainerDoc.exists()) {
          setTrainerData(trainerDoc.data() as TrainerProfile);
        }
      } catch (error) {
        console.error("Error fetching trainer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'trainers', user.uid), trainerData);
      alert("Profile updated successfully!");
      navigate('/dashboard');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold tracking-tight">Profile Settings</h1>
        </div>
        <button 
          form="settings-form"
          disabled={saving}
          className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="space-y-12">
        {/* Basic Info */}
        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold">Basic Information</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sport / Discipline</label>
              <input 
                type="text" 
                value={trainerData.sport || ''}
                onChange={(e) => setTrainerData({ ...trainerData, sport: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                placeholder="e.g. Personal Training, Yoga"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={trainerData.location || ''}
                  onChange={(e) => setTrainerData({ ...trainerData, location: e.target.value })}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  placeholder="City, Country"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bio</label>
            <textarea 
              value={trainerData.bio || ''}
              onChange={(e) => setTrainerData({ ...trainerData, bio: e.target.value })}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all h-32 resize-none"
              placeholder="Tell your story..."
              required
            />
          </div>
        </section>

        {/* Video Introduction */}
        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold">Introductory Video</h2>
          </div>
          
          <p className="text-gray-500 text-sm mb-4">
            Showcase your personality and expertise. Paste a link to your video (YouTube, Vimeo, or direct MP4 link).
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Video URL</label>
            <div className="relative">
              <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="url" 
                value={trainerData.videoUrl || ''}
                onChange={(e) => setTrainerData({ ...trainerData, videoUrl: e.target.value })}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          {trainerData.videoUrl && (
            <div className="aspect-video bg-black rounded-2xl overflow-hidden mt-6">
              {/* Preview placeholder or actual player */}
              <div className="w-full h-full flex items-center justify-center text-white/50 text-sm italic">
                Video Preview Available on Profile
              </div>
            </div>
          )}
        </section>

        {/* Pricing */}
        <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Pricing</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Single Session Price ($)</label>
              <input 
                type="number" 
                value={trainerData.sessionPrice || ''}
                onChange={(e) => setTrainerData({ ...trainerData, sessionPrice: Number(e.target.value) })}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Monthly Plan Price ($)</label>
              <input 
                type="number" 
                value={trainerData.monthlyPlanPrice || ''}
                onChange={(e) => setTrainerData({ ...trainerData, monthlyPlanPrice: Number(e.target.value) })}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default TrainerSettings;
