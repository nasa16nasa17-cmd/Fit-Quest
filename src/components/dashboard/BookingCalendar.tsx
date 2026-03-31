import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Calendar as CalendarIcon,
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';

const BookingCalendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });

  useEffect(() => {
    if (!user) return;

    // Listen for bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('trainerId', '==', user.uid)
    );

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(bookingsData);
      setLoading(false);
    });

    // Listen for availability
    const availabilityQuery = query(
      collection(db, 'availability'),
      where('trainerId', '==', user.uid)
    );

    const unsubscribeAvailability = onSnapshot(availabilityQuery, (snapshot) => {
      const availabilityData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailability(availabilityData);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeAvailability();
    };
  }, [user]);

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h2>
            <p className="text-sm text-gray-500">Manage your schedule and client sessions.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm font-bold hover:bg-gray-100 rounded-xl transition-all"
          >
            Today
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 border-t border-l border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {calendarDays.map((day, i) => {
          const dayBookings = bookings.filter(b => isSameDay(parseISO(b.date), day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[120px] p-4 border-r border-b border-gray-100 transition-all cursor-pointer relative ${
                !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
              } ${isSelected ? 'ring-2 ring-inset ring-black z-10' : 'hover:bg-gray-50'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-bold ${
                  isTodayDay ? 'bg-black text-white w-7 h-7 flex items-center justify-center rounded-full' : 
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayBookings.length > 0 && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </div>
              <div className="space-y-1">
                {dayBookings.slice(0, 2).map((booking, idx) => (
                  <div key={idx} className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg truncate">
                    {format(parseISO(booking.date), 'HH:mm')} Session
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-[10px] font-bold text-gray-400 pl-2">
                    +{dayBookings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'availability'), {
        trainerId: user.uid,
        ...newSlot
      });
      setShowAddAvailability(false);
    } catch (error) {
      console.error("Error adding availability:", error);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'availability', id));
    } catch (error) {
      console.error("Error deleting availability:", error);
    }
  };

  const selectedDayBookings = bookings.filter(b => isSameDay(parseISO(b.date), selectedDate));
  const selectedDayAvailability = availability.filter(a => a.dayOfWeek === selectedDate.getDay());

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Selected Day Details */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">Schedule for {format(selectedDate, 'MMMM d')}</h3>
            <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
              {selectedDayBookings.length} Sessions
            </div>
          </div>

          <div className="space-y-4">
            {selectedDayBookings.length > 0 ? (
              selectedDayBookings.sort((a, b) => a.date.localeCompare(b.date)).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{format(parseISO(booking.date), 'HH:mm')} - {format(addDays(parseISO(booking.date), 0), 'HH:mm')}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <User className="w-3 h-3 mr-1" />
                        <span>Client ID: {booking.buyerId.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm">No sessions scheduled for this day.</p>
              </div>
            )}
          </div>
        </div>

        {/* Availability Management */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">Weekly Availability</h3>
            <button 
              onClick={() => setShowAddAvailability(!showAddAvailability)}
              className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {showAddAvailability && (
            <form onSubmit={handleAddAvailability} className="mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Day</label>
                  <select 
                    value={newSlot.dayOfWeek}
                    onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Start</label>
                    <input 
                      type="time" 
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      className="w-full px-4 py-2 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">End</label>
                    <input 
                      type="time" 
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      className="w-full px-4 py-2 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="flex-grow bg-black text-white py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
                  Add Slot
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddAvailability(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName, idx) => {
              const dayIdx = (idx + 1) % 7;
              const daySlots = availability.filter(a => a.dayOfWeek === dayIdx);
              
              return (
                <div key={dayIdx} className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400">
                      {dayName.slice(0, 3)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.length > 0 ? daySlots.map((slot) => (
                        <div key={slot.id} className="group relative flex items-center bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-600">{slot.startTime} - {slot.endTime}</span>
                          <button 
                            onClick={() => handleDeleteAvailability(slot.id)}
                            className="ml-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )) : (
                        <span className="text-[10px] font-bold text-gray-300 italic">No slots set</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
