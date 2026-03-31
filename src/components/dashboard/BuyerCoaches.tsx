import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Booking, TrainerProfile } from '../../types';
import { Users, Search, Mail, Calendar, MessageSquare, ChevronRight, User as UserIcon, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

const BuyerCoaches = () => {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCoaches = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'bookings'),
          where('buyerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const bookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        
        const coachMap: { [uid: string]: any } = {};
        
        for (const b of bookings) {
          if (!coachMap[b.trainerId]) {
            coachMap[b.trainerId] = {
              uid: b.trainerId,
              displayName: b.trainerName,
              lastSession: b.date,
              totalSessions: 1,
              totalSpent: b.amount,
              status: b.bookingStatus === 'completed' ? 'active' : 'pending'
            };
          } else {
            coachMap[b.trainerId].totalSessions += 1;
            coachMap[b.trainerId].totalSpent += b.amount;
            if (new Date(b.date) > new Date(coachMap[b.trainerId].lastSession)) {
              coachMap[b.trainerId].lastSession = b.date;
            }
          }
        }

        const coachList = Object.values(coachMap);
        const updatedCoaches = await Promise.all(coachList.map(async (coach) => {
          const trainerSnap = await getDocs(query(collection(db, 'trainers'), where('userId', '==', coach.uid)));
          const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', coach.uid)));
          
          if (!trainerSnap.empty) {
            const trainerData = trainerSnap.docs[0].data() as TrainerProfile;
            const userData = userSnap.docs[0]?.data();
            return { 
              ...coach, 
              photoURL: userData?.photoURL, 
              rating: trainerData.rating,
              specialties: trainerData.specializations 
            };
          }
          return coach;
        }));

        setCoaches(updatedCoaches);
      } catch (error) {
        console.error("Error fetching coaches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, [user]);

  const filteredCoaches = coaches.filter(c => 
    c.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="py-20 text-center text-gray-400 font-bold">Loading coaches...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Coaches</h1>
          <p className="text-gray-500">Manage your training relationships and session history.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search coaches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filteredCoaches.length > 0 ? filteredCoaches.map((coach) => (
            <div key={coach.uid} className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-6">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {coach.photoURL ? (
                    <img src={coach.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-bold">{coach.displayName}</h3>
                    {coach.rating && (
                      <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-0.5 rounded-lg">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-700">{coach.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Last: {format(parseISO(coach.lastSession), 'MMM d, yyyy')}</span>
                    <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {coach.totalSessions} Sessions</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Link 
                  to={`/messages?chatId=${coach.uid}`}
                  className="p-4 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-all flex items-center space-x-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-bold">Message</span>
                </Link>
                <Link 
                  to={`/trainer/${coach.uid}`}
                  className="p-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all flex items-center space-x-2"
                >
                  <span className="text-sm font-bold">Book Again</span>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">No coaches found</h3>
              <p className="text-gray-500">You haven't booked any sessions yet.</p>
              <Link to="/browse" className="mt-4 inline-block text-black font-bold underline">Browse Trainers</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerCoaches;
