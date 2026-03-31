import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, ArrowRight, MessageSquare, CheckCircle2, AlertCircle, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';
import { format, isAfter, parseISO } from 'date-fns';
import BookingActions from '../bookings/BookingActions';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('buyerId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const upcomingBookings = bookings.filter(b => b.bookingStatus === 'confirmed' && isAfter(parseISO(b.date), new Date()));
  const pastBookings = bookings.filter(b => b.bookingStatus === 'completed' || (b.bookingStatus === 'confirmed' && !isAfter(parseISO(b.date), new Date())));
  const nextSession = upcomingBookings[0];

  const totalHours = bookings.filter(b => b.bookingStatus === 'completed').length; // Assuming 1hr per session for now

  if (loading) return <div className="py-20 text-center">Loading your dashboard...</div>;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back, {user?.displayName?.split(' ')[0] || 'Athlete'}</h1>
        <p className="text-gray-500">Manage your training sessions and track your progress.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Next Session</h3>
          {nextSession ? (
            <>
              <p className="text-2xl font-bold">{format(parseISO(nextSession.date), 'MMM do, HH:mm')}</p>
              <p className="text-gray-500 text-sm mt-2">Coach: {nextSession.trainerName}</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-gray-300">No sessions</p>
          )}
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
            <Star className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Sessions</h3>
          <p className="text-2xl font-bold">{bookings.filter(b => b.bookingStatus === 'completed').length} Completed</p>
          <p className="text-gray-500 text-sm mt-2">Across your journey</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Hours Trained</h3>
          <p className="text-2xl font-bold">{totalHours} Hours</p>
          <p className="text-gray-500 text-sm mt-2">Total time</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Recent Bookings</h2>
            <Link to="/dashboard/bookings" className="text-sm font-bold underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {bookings.length > 0 ? bookings.map((booking) => (
              <div key={booking.id} className="p-8 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                    {booking.bookingStatus === 'confirmed' ? <Clock className="w-6 h-6 text-blue-500" /> : 
                     booking.bookingStatus === 'pending' ? <Clock className="w-6 h-6 text-orange-500" /> :
                     <CheckCircle2 className="w-6 h-6 text-green-500" />}
                  </div>
                  <div>
                    <h4 className="font-bold capitalize">{booking.sessionType} with {booking.trainerName}</h4>
                    <p className="text-sm text-gray-500">{format(parseISO(booking.date), 'MMMM do, yyyy')}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        booking.bookingStatus === 'confirmed' ? 'bg-blue-50 text-blue-600' : 
                        booking.bookingStatus === 'completed' ? 'bg-green-50 text-green-600' : 
                        booking.bookingStatus === 'pending' ? 'bg-orange-50 text-orange-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {booking.bookingStatus}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{booking.paymentStatus}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <BookingActions 
                    booking={booking} 
                    userRole="buyer" 
                    onStatusUpdate={() => {}} 
                  />
                  <button className="text-gray-400 hover:text-black transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No bookings yet.</p>
                <Link to="/browse" className="text-black font-bold mt-4 inline-block hover:underline">Browse Trainers</Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Messages</h2>
            <Link to="/messages" className="text-sm font-bold underline">Go to Inbox</Link>
          </div>
          <div className="p-8 text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">Check your inbox for updates from your trainers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
