import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types';
import { TrendingUp, DollarSign, Calendar, ArrowUpRight, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const TrainerEarnings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingBalance: 0,
    thisMonth: 0,
    totalSessions: 0
  });

  const [commissionRate, setCommissionRate] = useState(0.15);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return;
      try {
        const settingsSnap = await getDocs(query(collection(db, 'platform_settings'), where('__name__', '==', 'global')));
        const rate = settingsSnap.empty ? 0.15 : (settingsSnap.docs[0].data().commissionPercentage / 100);
        setCommissionRate(rate);

        const q = query(
          collection(db, 'bookings'),
          where('trainerId', '==', user.uid),
          where('paymentStatus', '==', 'paid'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const bookingsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(bookingsData);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let total = 0;
        let pending = 0;
        let monthly = 0;

        bookingsData.forEach(b => {
          const amount = b.amount || 0;
          const platformFee = amount * rate;
          const netAmount = amount - platformFee;

          if (b.bookingStatus === 'completed') {
            total += netAmount;
            if (new Date(b.date) >= startOfMonth) {
              monthly += netAmount;
            }
          } else if (['confirmed', 'upcoming', 'in_progress'].includes(b.bookingStatus)) {
            pending += netAmount;
          }
        });

        setStats({
          totalEarnings: total,
          pendingBalance: pending,
          thisMonth: monthly,
          totalSessions: bookingsData.filter(b => b.bookingStatus === 'completed').length
        });
      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user]);

  if (loading) return <div className="py-20 text-center text-gray-400 font-bold">Loading earnings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Earnings</h1>
          <p className="text-gray-500">Track your revenue and session history.</p>
        </div>
        <button className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center shadow-xl shadow-black/10">
          <CreditCard className="w-5 h-5 mr-2" />
          Payout Settings
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Earned</h3>
          <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</h3>
          <p className="text-2xl font-bold">${stats.pendingBalance.toFixed(2)}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">This Month</h3>
          <p className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</p>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sessions</h3>
          <p className="text-2xl font-bold">{stats.totalSessions}</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <h2 className="text-xl font-bold">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Client</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Service</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.length > 0 ? bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-sm">{format(new Date(b.createdAt), 'MMM d, yyyy')}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-sm">{b.buyerName}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-gray-500">{b.sessionType}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-sm text-green-600">${(b.amount * (1 - commissionRate)).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">After {(commissionRate * 100).toFixed(0)}% fee</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      b.bookingStatus === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {b.bookingStatus === 'completed' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400">
                    No payment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrainerEarnings;
