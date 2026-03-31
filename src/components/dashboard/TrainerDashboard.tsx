import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Star, Calendar, ArrowRight, DollarSign, Settings, Clock, CheckCircle, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Booking, TrainerProfile } from '../../types';
import { format, parseISO, isAfter } from 'date-fns';
import BookingActions from '../bookings/BookingActions';

const TrainerDashboard = () => {
  const { user } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState<Booking[]>([]);
  const [trainerStats, setTrainerStats] = useState<Partial<TrainerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [hasApplied, setHasApplied] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for trainer profile
    const trainerQuery = query(collection(db, 'trainers'), where('userId', '==', user.uid));
    const unsubscribeTrainer = onSnapshot(trainerQuery, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data() as TrainerProfile;
        setTrainerStats({ ...data, id: snap.docs[0].id });
        setIsApproved(data.isApproved);
        setHasApplied(true);
      } else {
        setIsApproved(false);
        setHasApplied(false);
      }
    });

    // Real-time listener for upcoming bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('trainerId', '==', user.uid),
      where('bookingStatus', 'in', ['confirmed', 'upcoming', 'pending']),
      orderBy('date', 'asc'),
      limit(10)
    );
    
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snap) => {
      const bookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setUpcomingSessions(bookings);
      setLoading(false);
    });

    return () => {
      unsubscribeTrainer();
      unsubscribeBookings();
    };
  }, [user]);

  if (loading) {
    return <div className="py-20 text-center text-gray-400 font-bold">Loading dashboard...</div>;
  }

  if (hasApplied === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Settings className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Complete Your Coach Profile</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          You've signed up as a coach, but you haven't completed your professional profile yet. 
          Fill out your details to start accepting athletes.
        </p>
        <div className="flex space-x-4">
          <Link to="/apply" className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all">
            Complete Application
          </Link>
          <Link to="/" className="bg-gray-100 text-gray-600 px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all">
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  if (isApproved === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Application Pending</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Your coach application is currently being reviewed by our team. This usually takes 24-48 hours. 
          We'll notify you as soon as your profile is active.
        </p>
        <div className="flex space-x-4">
          <Link to="/dashboard/profile" className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all">
            Review Profile
          </Link>
          <Link to="/" className="bg-gray-100 text-gray-600 px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all">
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  const pendingBookings = upcomingSessions.filter(b => b.bookingStatus === 'pending');
  const confirmedBookings = upcomingSessions.filter(b => b.bookingStatus === 'confirmed');

  return (
    <div>
      <div className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Coach Dashboard</h1>
          <p className="text-gray-500">Manage your athletes, bookings, and business growth.</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            to="/dashboard/availability" 
            className="flex items-center space-x-2 bg-white border border-gray-100 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Clock className="w-5 h-5" />
            <span>Availability</span>
          </Link>
          <Link 
            to="/dashboard/profile" 
            className="flex items-center space-x-2 bg-white border border-gray-100 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <Settings className="w-5 h-5" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Clients</h3>
          <p className="text-2xl font-bold">{trainerStats.sessionsCompleted || 0}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Session Price</h3>
          <p className="text-2xl font-bold">${trainerStats.sessionPrice || 0}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Average Rating</h3>
          <p className="text-2xl font-bold">{trainerStats.rating?.toFixed(1) || '0.0'}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Reviews</h3>
          <p className="text-2xl font-bold">{trainerStats.reviewCount || 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold">Upcoming Sessions</h2>
            <Link to="/dashboard/bookings" className="text-sm font-bold underline">View calendar</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {confirmedBookings.length > 0 ? confirmedBookings.map((session) => (
              <div key={session.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{session.buyerName} ({session.sessionType})</h4>
                    <p className="text-xs text-gray-500">{format(parseISO(session.date), 'MMM d, h:mm a')}</p>
                    {session.meetingLink && (
                      <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-widest flex items-center">
                        <Video className="w-3 h-3 mr-1" /> Meeting Link Attached
                      </p>
                    )}
                  </div>
                </div>
                <BookingActions 
                  booking={session} 
                  userRole="trainer" 
                  onStatusUpdate={() => {}} 
                />
              </div>
            )) : (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No upcoming sessions.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold">Pending Requests</h2>
            <Link to="/dashboard/bookings" className="text-sm font-bold underline">Manage</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingBookings.length > 0 ? pendingBookings.map((booking) => (
              <div key={booking.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{booking.buyerName}</h4>
                    <p className="text-xs text-gray-500">{format(parseISO(booking.date), 'MMM d, h:mm a')}</p>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">Awaiting Payment</p>
                  </div>
                </div>
                <Link to="/dashboard/bookings" className="text-gray-400 hover:text-black">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )) : (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No pending requests.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
