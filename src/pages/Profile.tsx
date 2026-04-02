import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Mail, Camera, Save, CheckCircle, Loader2, Link, Bug, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Profile = () => {
  const { user, profile } = useAuth();
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
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

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhotoURL(profile.photoURL || '');
    }
  }, [profile]);

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
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: base64String,
        updatedAt: new Date().toISOString()
      });
      
      setPhotoURL(base64String);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error in handleFileChange:", err);
      setError(`Failed to process image: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
    <div className="min-h-screen bg-gray-50 pt-12 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-black relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          </div>

          <div className="p-8 pb-0">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 relative">
              <div className="w-40 h-40 rounded-3xl bg-white p-1 shadow-2xl relative group -mt-24 border border-gray-100 z-10 flex-shrink-0">
                <div className="w-full h-full rounded-2xl bg-gray-100 overflow-hidden relative border-2 border-white shadow-inner">
                  {photoURL ? (
                    <img src={photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-3xl font-black text-gray-400 tracking-tighter">
                        {displayName ? getInitials(displayName) : <User className="w-10 h-10" />}
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

              <div className="flex-1 text-center md:text-left pt-4 md:pt-0 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 overflow-hidden">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 truncate">{profile?.displayName || 'Your Profile'}</h1>
                    <p className="text-gray-500 font-medium text-lg truncate">{user.email}</p>
                    <div className="mt-4 inline-flex items-center px-4 py-1.5 bg-gray-50 rounded-full border border-gray-200 shadow-sm">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
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
                  <div className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg self-center md:self-start flex-shrink-0">
                    {profile?.role || 'Member'}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8 pb-12 border-t border-gray-50 pt-12">
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
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Profile Picture URL (Optional Fallback)</label>
                  <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="url" 
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>
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
