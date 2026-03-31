import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Booking, UserProfile } from '../../types';
import { Users, Search, Mail, Calendar, MessageSquare, ChevronRight, User as UserIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

const TrainerClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'bookings'),
          where('trainerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const bookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        
        // Group by buyerId and get unique clients
        const clientMap: { [uid: string]: any } = {};
        
        for (const b of bookings) {
          if (!clientMap[b.buyerId]) {
            clientMap[b.buyerId] = {
              uid: b.buyerId,
              displayName: b.buyerName,
              lastSession: b.date,
              totalSessions: 1,
              totalSpent: b.amount,
              status: b.bookingStatus === 'completed' ? 'active' : 'pending'
            };
          } else {
            clientMap[b.buyerId].totalSessions += 1;
            clientMap[b.buyerId].totalSpent += b.amount;
            if (new Date(b.date) > new Date(clientMap[b.buyerId].lastSession)) {
              clientMap[b.buyerId].lastSession = b.date;
            }
          }
        }

        // Fetch user profiles for photos
        const clientList = Object.values(clientMap);
        const updatedClients = await Promise.all(clientList.map(async (client) => {
          const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', client.uid)));
          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data() as UserProfile;
            return { ...client, photoURL: userData.photoURL, email: userData.email };
          }
          return client;
        }));

        setClients(updatedClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user]);

  const filteredClients = clients.filter(c => 
    c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="py-20 text-center text-gray-400 font-bold">Loading clients...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Athletes</h1>
          <p className="text-gray-500">Manage your coaching relationships and performance history.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search athletes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Athletes</h3>
          <p className="text-2xl font-bold">{clients.length}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active This Month</h3>
          <p className="text-2xl font-bold">{clients.filter(c => new Date(c.lastSession) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Unread Messages</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filteredClients.length > 0 ? filteredClients.map((client) => (
            <div key={client.uid} className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors gap-6">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {client.photoURL ? (
                    <img src={client.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{client.displayName}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {client.email}</span>
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Last: {format(parseISO(client.lastSession), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Sessions</p>
                  <p className="font-bold">{client.totalSessions}</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Revenue</p>
                  <p className="font-bold text-green-600">${client.totalSpent.toFixed(2)}</p>
                </div>
                <div className="flex space-x-2">
                  <Link 
                    to={`/messages?chatId=${client.uid}`}
                    className="p-3 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  <button className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">No athletes found</h3>
              <p className="text-gray-500">Try adjusting your search or check back later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerClients;
