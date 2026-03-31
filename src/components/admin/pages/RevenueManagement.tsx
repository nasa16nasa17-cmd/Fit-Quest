import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, doc, getDoc, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Search, Filter, DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, User, Download, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const data = [
  { name: 'Mon', revenue: 1200 },
  { name: 'Tue', revenue: 1900 },
  { name: 'Wed', revenue: 1500 },
  { name: 'Thu', revenue: 2100 },
  { name: 'Fri', revenue: 2400 },
  { name: 'Sat', revenue: 3200 },
  { name: 'Sun', revenue: 2800 },
];

const RevenueManagement = ({ stats }: any) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [commissionRate, setCommissionRate] = useState(15);

  useEffect(() => {
    const fetchCommission = async () => {
      const settingsSnap = await getDocs(query(collection(db, 'platform_settings'), where('__name__', '==', 'global')));
      if (!settingsSnap.empty) {
        setCommissionRate(settingsSnap.docs[0].data().commissionPercentage || 15);
      }
    };
    fetchCommission();

    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Revenue & Payments</h1>
          <p className="text-gray-400 font-medium">Track platform earnings and transaction history.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Financials</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black tracking-tight">Daily Revenue</h3>
            <div className="flex items-center space-x-2 text-xs font-black text-green-500 bg-green-50 px-3 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3" />
              <span>Real-time tracking active</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#999'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#999'}} />
                <Tooltip 
                  cursor={{fill: '#f9f9f9'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700}}
                />
                <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#000' : '#e5e7eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black p-10 rounded-[40px] text-white shadow-xl shadow-black/20 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/50 mb-1">Total Platform Revenue</h3>
            <p className="text-4xl font-black tracking-tight mb-8">${stats.totalRevenue.toLocaleString()}</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Last Transaction</p>
                <p className="text-sm font-bold">Just now</p>
              </div>
              <CreditCard className="w-8 h-8 text-white/20" />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Total Commission</h3>
            <p className="text-3xl font-black tracking-tight mb-6">${stats.commission.toLocaleString()}</p>
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span>{commissionRate}% fixed platform fee</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Transaction ID</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Amount</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-sm font-bold text-gray-600">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="truncate max-w-[150px]">{payment.stripeId || payment.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-black">${payment.amount.toFixed(2)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        payment.status === 'succeeded' ? 'bg-green-500' : 
                        payment.status === 'failed' ? 'bg-red-500' :
                        'bg-orange-500'
                      }`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        payment.status === 'succeeded' ? 'text-green-600' : 
                        payment.status === 'failed' ? 'text-red-600' :
                        'text-orange-600'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-400">
                      {payment.createdAt?.seconds ? format(new Date(payment.createdAt.seconds * 1000), 'MMM do, yyyy') : 'Recently'}
                    </p>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                    No transactions recorded yet.
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

export default RevenueManagement;
