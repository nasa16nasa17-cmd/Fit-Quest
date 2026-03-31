import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfDay, 
  isSameDay, 
  parseISO, 
  addMinutes, 
  isAfter, 
  isBefore,
  setHours,
  setMinutes,
  eachDayOfInterval
} from 'date-fns';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TrainerProfile, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: TrainerProfile;
  trainerUser: UserProfile;
  onConfirm: (bookingData: any) => void;
  loading: boolean;
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  trainer, 
  trainerUser, 
  onConfirm,
  loading 
}) => {
  const [step, setStep] = useState<'type' | 'date' | 'time' | 'confirm'>('type');
  const [selectedType, setSelectedType] = useState<'session' | 'monthly'>('session');
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Fetch availability and bookings
  useEffect(() => {
    if (!isOpen || !trainer.userId) return;

    const qAvailability = query(
      collection(db, 'availability'),
      where('trainerId', '==', trainer.userId)
    );
    const unsubscribeAvailability = onSnapshot(qAvailability, (snapshot) => {
      setAvailability(snapshot.docs.map(doc => doc.data()));
    });

    const qBookings = query(
      collection(db, 'bookings'),
      where('trainerId', '==', trainer.userId),
      where('status', 'in', ['confirmed', 'pending'])
    );
    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      setExistingBookings(snapshot.docs.map(doc => doc.data()));
    });

    return () => {
      unsubscribeAvailability();
      unsubscribeBookings();
    };
  }, [isOpen, trainer.userId]);

  // Calculate available slots when date changes
  useEffect(() => {
    if (selectedType === 'monthly') {
      setAvailableSlots([]);
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek);
    
    if (dayAvailability.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots: string[] = [];
    const duration = trainer.sessionDuration || 60;
    const buffer = trainer.bufferTime || 15;

    dayAvailability.forEach(avail => {
      const [startH, startM] = avail.startTime.split(':').map(Number);
      const [endH, endM] = avail.endTime.split(':').map(Number);
      
      let current = setMinutes(setHours(startOfDay(selectedDate), startH), startM);
      const end = setMinutes(setHours(startOfDay(selectedDate), endH), endM);

      while (isBefore(addMinutes(current, duration), end) || isSameDay(current, end)) {
        const slotStr = format(current, "yyyy-MM-dd'T'HH:mm:ss");
        
        // Check if slot is taken
        const isTaken = existingBookings.some(b => {
          const bStart = parseISO(b.date);
          const bEnd = addMinutes(bStart, duration);
          return (
            (isAfter(current, bStart) && isBefore(current, bEnd)) ||
            (isAfter(addMinutes(current, duration), bStart) && isBefore(addMinutes(current, duration), bEnd)) ||
            isSameDay(current, bStart)
          );
        });

        if (!isTaken && isAfter(current, new Date())) {
          slots.push(slotStr);
        }
        
        current = addMinutes(current, duration + buffer);
      }
    });

    setAvailableSlots(slots);
  }, [selectedDate, availability, existingBookings, selectedType, trainer.sessionDuration, trainer.bufferTime]);

  if (!isOpen) return null;

  const nextStep = () => {
    if (step === 'type') setStep('date');
    else if (step === 'date') setStep('time');
    else if (step === 'time') setStep('confirm');
  };

  const prevStep = () => {
    if (step === 'date') setStep('type');
    else if (step === 'time') setStep('date');
    else if (step === 'confirm') setStep('time');
  };

  const handleConfirm = () => {
    const startTime = selectedTime ? format(parseISO(selectedTime), 'HH:mm') : '';
    const duration = trainer.sessionDuration || 60;
    const endTime = selectedTime ? format(addMinutes(parseISO(selectedTime), duration), 'HH:mm') : '';

    onConfirm({
      type: selectedType,
      date: selectedTime ? format(parseISO(selectedTime), 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd'),
      startTime,
      endTime,
      duration,
      sessionType: selectedType === 'session' ? '1-on-1 Session' : 'Monthly Coaching',
      amount: selectedType === 'session' ? trainer.sessionPrice : trainer.monthlyPlanPrice,
      trainerName: trainerUser.displayName,
      meetingLink: trainer.defaultMeetingLink || '',
      // buyerName will be handled on the server or passed if available
    });
  };

  const next7Days = eachDayOfInterval({
    start: new Date(),
    end: addDays(new Date(), 14)
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Book {trainerUser.displayName}</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Step {step === 'type' ? '1' : step === 'date' ? '2' : step === 'time' ? '3' : '4'} of 4</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {step === 'type' && (
              <motion.div 
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold mb-8">Choose your coaching type</h3>
                <div className="grid gap-4">
                  <button 
                    onClick={() => { setSelectedType('session'); nextStep(); }}
                    className={`flex items-center justify-between p-8 rounded-3xl border-2 transition-all text-left ${selectedType === 'session' ? 'border-black bg-black text-white shadow-xl' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedType === 'session' ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <Clock className={`w-7 h-7 ${selectedType === 'session' ? 'text-white' : 'text-black'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Single Session</p>
                        <p className={`text-sm ${selectedType === 'session' ? 'text-white/60' : 'text-gray-500'}`}>60-min personalized coaching</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${trainer.sessionPrice}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedType === 'session' ? 'text-white/40' : 'text-gray-400'}`}>Per Session</p>
                    </div>
                  </button>

                  {trainer.monthlyPlanPrice && (
                    <button 
                      onClick={() => { setSelectedType('monthly'); nextStep(); }}
                      className={`flex items-center justify-between p-8 rounded-3xl border-2 transition-all text-left ${selectedType === 'monthly' ? 'border-black bg-black text-white shadow-xl' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center space-x-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedType === 'monthly' ? 'bg-white/10' : 'bg-gray-100'}`}>
                          <CalendarIcon className={`w-7 h-7 ${selectedType === 'monthly' ? 'text-white' : 'text-black'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Monthly Coaching</p>
                          <p className={`text-sm ${selectedType === 'monthly' ? 'text-white/60' : 'text-gray-500'}`}>Unlimited support & weekly calls</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${trainer.monthlyPlanPrice}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedType === 'monthly' ? 'text-white/40' : 'text-gray-400'}`}>Per Month</p>
                      </div>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'date' && (
              <motion.div 
                key="date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">Select a date</h3>
                  <div className="text-sm font-bold text-gray-400">{format(selectedDate, 'MMMM yyyy')}</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {next7Days.map((day, i) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isPast = isBefore(day, startOfDay(new Date()));
                    return (
                      <button
                        key={i}
                        disabled={isPast}
                        onClick={() => setSelectedDate(day)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                          isSelected 
                          ? 'bg-black text-white shadow-lg scale-105' 
                          : isPast ? 'opacity-20 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">{format(day, 'EEE')}</span>
                        <span className="text-lg font-black">{format(day, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between pt-8">
                  <button onClick={prevStep} className="px-8 py-4 text-gray-500 font-bold hover:text-black transition-all">Back</button>
                  <button onClick={nextStep} className="px-12 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center">
                    Next <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'time' && (
              <motion.div 
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h3 className="text-2xl font-bold mb-8">Available slots for {format(selectedDate, 'EEEE, MMM do')}</h3>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map((slot, i) => {
                      const isSelected = selectedTime === slot;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                            isSelected 
                            ? 'bg-black text-white border-black shadow-lg' 
                            : 'bg-white border-gray-100 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          {format(parseISO(slot), 'HH:mm')}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No available slots for this day.</p>
                    <button onClick={() => setStep('date')} className="text-black font-bold mt-4 hover:underline">Try another date</button>
                  </div>
                )}
                <div className="flex justify-between pt-8">
                  <button onClick={prevStep} className="px-8 py-4 text-gray-500 font-bold hover:text-black transition-all">Back</button>
                  <button 
                    disabled={!selectedTime}
                    onClick={nextStep} 
                    className="px-12 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center disabled:opacity-50"
                  >
                    Review <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div 
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h3 className="text-2xl font-bold mb-8">Review your booking</h3>
                <div className="bg-gray-50 p-8 rounded-[40px] space-y-6 border border-gray-100">
                  <div className="flex justify-between items-start pb-6 border-b border-gray-200">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Coaching Type</p>
                      <p className="text-xl font-bold">{selectedType === 'session' ? '1-on-1 Session' : 'Monthly Coaching'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Price</p>
                      <p className="text-xl font-bold">${selectedType === 'session' ? trainer.sessionPrice : trainer.monthlyPlanPrice}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Date & Time</p>
                      <p className="text-lg font-bold">{format(selectedDate, 'MMM do, yyyy')}</p>
                      {selectedTime && <p className="text-sm text-gray-500 font-medium">{format(parseISO(selectedTime), 'HH:mm')} (Local Time)</p>}
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">Secure payment processed via Stripe. Platform commission included.</p>
                </div>

                <div className="flex justify-between pt-8">
                  <button onClick={prevStep} className="px-8 py-4 text-gray-500 font-bold hover:text-black transition-all">Back</button>
                  <button 
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-grow py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center shadow-xl shadow-black/10 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Confirm & Pay'} <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
