import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { User, Camera, Save, CheckCircle, Video, Loader2, Bug } from 'lucide-react';
import { motion } from 'motion/react';

const ProfileSettings = () => {
  const { profile, user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [defaultMeetingLink, setDefaultMeetingLink] = useState('');
  const [trainerDocId, setTrainerDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTrainerData = async () => {
      if (user && profile?.role === 'trainer') {
        const q = query(collection(db, 'trainers'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setTrainerDocId(snap.docs[0].id);
          setDefaultMeetingLink(snap.docs[0].data().defaultMeetingLink || '');
        }
      }
    };
    fetchTrainerData();
  }, [user, profile]);

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
      
      setPhotoURL(base64String);
      
      // Update User profile immediately in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: base64String,
        updatedAt: new Date().toISOString(),
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error processing photo:", err);
      setError(`Failed to process image: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccess(false);
    try {
      // Update User profile
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        photoURL,
        updatedAt: new Date().toISOString(),
      });

      // Update Trainer profile if applicable
      if (trainerDocId) {
        await updateDoc(doc(db, 'trainers', trainerDocId), {
          defaultMeetingLink,
          updatedAt: new Date().toISOString(),
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Profile Settings</h1>
        <p className="text-gray-500 text-lg">Update your personal information and how others see you.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
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
              </div>
              <div 
                className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center">
                <Bug className="w-3 h-3 mr-2" />
                {error}
              </div>
            )}

            <div className="w-full">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Profile Picture URL</label>
              <input 
                type="url" 
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all text-sm"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all font-bold"
              placeholder="Your Name"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
            <input 
              type="email" 
              value={profile?.email || ''}
              disabled
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-gray-400 cursor-not-allowed font-medium"
            />
            <p className="mt-2 text-[10px] text-gray-400 font-medium">Email cannot be changed for security reasons.</p>
          </div>

          {/* Trainer Specific Settings */}
          {profile?.role === 'trainer' && (
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-bold mb-6 flex items-center">
                <Video className="w-5 h-5 mr-2 text-blue-600" />
                Coach Settings
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Default Meeting Link (Zoom/Meet)</label>
                <input 
                  type="url" 
                  value={defaultMeetingLink}
                  onChange={(e) => setDefaultMeetingLink(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all text-sm"
                  placeholder="https://zoom.us/j/..."
                />
                <p className="mt-2 text-[10px] text-gray-400 font-medium">This link will be automatically shared with athletes after booking.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button 
            type="submit"
            disabled={saving}
            className="bg-black text-white px-10 py-4 rounded-full font-bold hover:bg-gray-800 transition-all flex items-center disabled:opacity-50 shadow-xl shadow-black/10"
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </button>

          {success && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center text-green-600 font-bold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Profile updated!
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
