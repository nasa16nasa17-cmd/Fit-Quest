import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Availability } from '../../types';
import { Plus, Trash2, Clock, Calendar, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const AvailabilityManagement = () => {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00'
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'availability'),
      where('trainerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Availability));
      setAvailabilities(data.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'availability'), {
        trainerId: user.uid,
        dayOfWeek: Number(newSlot.dayOfWeek),
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error adding availability:", error);
      alert("Failed to add availability slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'availability', id));
    } catch (error) {
      console.error("Error deleting availability:", error);
      alert("Failed to delete availability slot.");
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-400 font-bold">Loading availability...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Availability Management</h1>
        <p className="text-gray-500 text-lg">Set your working hours so clients can book sessions with you.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add New Slot */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add New Slot
            </h2>
            <form onSubmit={handleAddSlot} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Day of Week</label>
                <select 
                  value={newSlot.dayOfWeek}
                  onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all font-bold"
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                  <input 
                    type="time" 
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">End Time</label>
                  <input 
                    type="time" 
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all font-bold"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-black text-white px-6 py-4 rounded-full font-bold hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50 shadow-xl shadow-black/10"
              >
                {saving ? 'Adding...' : 'Add Slot'}
              </button>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center text-green-600 font-bold text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Slot added!
                </motion.div>
              )}
            </form>
          </div>
        </div>

        {/* Current Slots */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h2 className="text-xl font-bold flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Current Availability
              </h2>
            </div>
            
            <div className="divide-y divide-gray-50">
              {availabilities.length > 0 ? availabilities.map((slot) => (
                <div key={slot.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center space-x-6">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-bold text-xs text-gray-400">
                      {DAYS[slot.dayOfWeek].substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{DAYS[slot.dayOfWeek]}</h4>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-sm">No availability slots set yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManagement;
