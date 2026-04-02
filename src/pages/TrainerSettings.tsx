import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { TrainerProfile } from '../types';
import { Save, ArrowLeft, Video, Info, DollarSign, MapPin, Globe, Camera, Loader2, Link as LinkIcon, Bug, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const TrainerSettings = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [trainerData, setTrainerData] = useState<Partial<TrainerProfile>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDebugStorage = async () => {
    try {
      const response = await fetch('/api/debug/storage');
      const data = await response.json();
      setDebugInfo(data);
      console.log('Storage Debug Info:', data);
    } catch (err: any) {
      console.error('Debug failed:', err);
      setDebugInfo({ error: err.message });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    
    // Firestore has a 1MB limit per document. Base64 adds ~33% overhead.
    // We'll limit to 500KB to be safe and keep performance decent.
    if (file.size > 500 * 1024) {
      setError("Image is too large for direct storage. Please choose a smaller image (under 500KB) or use a URL.");
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64String = await base64Promise;
      
      // Update Firestore immediately
      await updateDoc(doc(db, 'trainers', user.uid), {
        photoURL: base64String,
        updatedAt: new Date().toISOString()
      });
      
      setTrainerData(prev => ({ ...prev, photoURL: base64String }));
    } catch (err: any) {
      console.error("Error in handleFileChange:", err);
      setError(`Failed to process image: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
    <div className="max-w-4xl mx-auto px-4 py-8">
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
          
          <div className="bg-gray-50/50 p-6 rounded-3xl mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md relative group">
                <div className="w-full h-full rounded-xl bg-gray-100 overflow-hidden relative border-2 border-white shadow-inner">
                  {trainerData.photoURL ? (
                    <img src={trainerData.photoURL} alt="Trainer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-2xl font-black text-gray-400 tracking-tighter">
                        {profile?.displayName ? getInitials(profile.displayName) : <Camera className="w-8 h-8" />}
                      </span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                      <Loader2 className="w-6 h-6 text-white animate-spin mb-2" />
                      <span className="text-[8px] font-bold text-white uppercase tracking-widest">Uploading</span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploading(false);
                          setError("Upload cancelled by user.");
                        }}
                        className="mt-2 text-[8px] text-white/60 hover:text-white underline uppercase tracking-tighter"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-lg font-bold mb-1">Trainer Profile Picture</h3>
                <p className="text-sm text-gray-500 mb-2">Upload a profile picture for your trainer profile.</p>
                <div className="inline-flex items-center px-3 py-1 bg-white rounded-full border border-gray-200">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    JPG, PNG • Max 5MB • 400x400 Recommended
                  </span>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center">
                    <Bug className="w-3 h-3 mr-2" />
                    {error}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={handleDebugStorage}
                  className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1"
                >
                  <Bug className="w-3 h-3" /> Debug Storage
                </button>

                {debugInfo && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl text-[10px] font-mono overflow-auto max-h-32 border border-gray-100">
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
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
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Profile Picture URL (Optional Fallback)</label>
            <div className="relative">
              <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="url" 
                value={trainerData.photoURL || ''}
                onChange={(e) => setTrainerData({ ...trainerData, photoURL: e.target.value })}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                placeholder="https://example.com/photo.jpg"
              />
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
