import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, doc, getDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Search, Filter, Calendar, User, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, MoreVertical, ExternalLink, RotateCcw, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';

const BookingManagement = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch trainer and buyer names for each booking
      const bookingsWithDetails = await Promise.all(bookingsData.map(async (booking: any) => {
        try {
          const trainerDoc = await getDoc(doc(db, 'trainers', booking.trainerProfileId || booking.trainerId));
          const trainerData = trainerDoc.data();
          
          const trainerUserDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', trainerData?.userId || booking.trainerId)));
          const trainerName = trainerUserDoc.docs[0]?.data()?.displayName || 'Unknown Trainer';

          const buyerDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', booking.buyerId)));
          const buyerName = buyerDoc.docs[0]?.data()?.displayName || 'Unknown Buyer';

          return { ...booking, trainerName, buyerName };
        } catch (err) {
          console.error("Error fetching booking details:", err);
          return { ...booking, trainerName: 'Error', buyerName: 'Error' };
        }
      }));

      setBookings(bookingsWithDetails);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [confirmRefund, setConfirmRefund] = useState<string | null>(null);

  const handleRefund = async (bookingId: string) => {
    if (confirmRefund !== bookingId) {
      setConfirmRefund(bookingId);
      setTimeout(() => setConfirmRefund(null), 3000);
      return;
    }
    
    setActionLoading(bookingId);
    try {
      const response = await fetch('/api/refund-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, adminId: user?.uid })
      });
      
      const result = await response.json();
      if (result.success) {
        setConfirmRefund(null);
      } else {
        alert(`Refund failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error refunding booking:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter((b: any) => {
    const trainer = b.trainerName?.toLowerCase() || '';
    const buyer = b.buyerName?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch = trainer.includes(search) || buyer.includes(search);
    const matchesStatus = filterStatus === 'All' || b.bookingStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['All', 'pending', 'confirmed', 'completed', 'cancelled', 'refunded'];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Booking Management</h1>
          <p className="text-gray-400 font-medium">Monitor and manage all platform sessions.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search by trainer or buyer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-6 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-gray-400 w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 transition-all outline-none appearance-none cursor-pointer capitalize"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Booking ID</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Trainer</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Buyer</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Date/Time</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Amount</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Meeting</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="p-20 text-center text-gray-400 font-bold">Loading...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan={7} className="p-20 text-center text-gray-400 font-bold">No bookings found.</td></tr>
              ) : filteredBookings.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">#{booking.id?.slice(0, 8)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-sm font-bold text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{booking.trainerName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-sm font-bold text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{booking.buyerName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm font-bold text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{booking.date ? format(parseISO(booking.date), 'MMM do, yyyy') : 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{booking.date ? format(parseISO(booking.date), 'HH:mm') : 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-1 text-sm font-black text-black">
                      <DollarSign className="w-4 h-4" />
                      <span>{booking.price?.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      {booking.meetingLink ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Video className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Set</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Video className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">None</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        booking.bookingStatus === 'confirmed' ? 'bg-green-500' : 
                        booking.bookingStatus === 'completed' ? 'bg-blue-500' :
                        booking.bookingStatus === 'cancelled' ? 'bg-red-500' :
                        booking.bookingStatus === 'refunded' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        booking.bookingStatus === 'confirmed' ? 'text-green-600' : 
                        booking.bookingStatus === 'completed' ? 'text-blue-600' :
                        booking.bookingStatus === 'cancelled' ? 'text-red-600' :
                        booking.bookingStatus === 'refunded' ? 'text-purple-600' :
                        'text-orange-600'
                      }`}>
                        {booking.bookingStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      {booking.paymentStatus === 'paid' && booking.bookingStatus !== 'refunded' && (
                        <button 
                          onClick={() => handleRefund(booking.id)}
                          disabled={actionLoading === booking.id}
                          className={`p-2 rounded-xl transition-all ${confirmRefund === booking.id ? 'bg-red-600 text-white scale-110' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`}
                          title={confirmRefund === booking.id ? "Click again to confirm refund" : "Refund Booking"}
                        >
                          <RotateCcw className={`w-5 h-5 ${actionLoading === booking.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-black hover:text-white transition-all">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;
