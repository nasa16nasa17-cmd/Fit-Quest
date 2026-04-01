import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Camera, Save, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Profile = () => {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        photoURL,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-black relative">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-2xl bg-gray-100 overflow-hidden relative group">
                  {photoURL ? (
                    <img src={photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-16 p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-1">{profile?.displayName || 'Your Profile'}</h1>
                <p className="text-gray-500 font-medium">{user.email}</p>
              </div>
              <div className="px-4 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {profile?.role || 'Member'}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="email" 
                      value={user.email || ''}
                      disabled
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Profile Picture URL</label>
                <div className="relative">
                  <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="url" 
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1">Paste a direct link to an image (JPG, PNG, etc.)</p>
              </div>

              <div className="pt-4 flex items-center space-x-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 md:flex-none px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  Save Changes
                </button>

                <AnimatePresence>
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center text-green-500 font-bold text-sm"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Changes saved successfully!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>
        </div>

        {/* Account Stats / Info */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Joined</p>
            <p className="font-bold">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Account Type</p>
            <p className="font-bold capitalize">{profile?.role || 'Member'}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
            <div className="font-bold text-green-500 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
