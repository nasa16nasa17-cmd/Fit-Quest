import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Search, Filter, User, Mail, Calendar, MapPin, MoreVertical, Trash2, ShieldAlert } from 'lucide-react';

const BuyerManagement = ({ handleSuspend }: { handleSuspend: (id: string, status: string) => void }) => {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'buyer'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const buyersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBuyers(buyersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const onSuspend = async (id: string, currentStatus: string) => {
    setActionLoading(id);
    try {
      await handleSuspend(id, currentStatus);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBuyers = buyers.filter((b: any) => {
    const name = b.displayName?.toLowerCase() || '';
    const email = b.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Buyer Management</h1>
          <p className="text-gray-400 font-medium">Manage platform clients and their activity.</p>
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
                placeholder="Search buyers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-6 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-gray-400 w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Buyer</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Email</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Joined</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold">Loading...</td></tr>
              ) : filteredBuyers.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold">No buyers found.</td></tr>
              ) : filteredBuyers.map((buyer: any) => (
                <tr key={buyer.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shadow-sm">
                        {buyer.photoURL ? (
                          <img src={buyer.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="text-gray-300 w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-none mb-1">{buyer.displayName || 'Unknown'}</h4>
                        <p className="text-xs text-gray-400 font-bold">ID: {buyer.uid?.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-sm font-bold text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{buyer.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-sm font-bold text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${buyer.status === 'suspended' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className={`text-xs font-black uppercase tracking-widest ${buyer.status === 'suspended' ? 'text-red-600' : 'text-green-600'}`}>
                        {buyer.status === 'suspended' ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onSuspend(buyer.id, buyer.status)}
                        disabled={actionLoading === buyer.id}
                        className={`p-2 rounded-xl transition-colors ${buyer.status === 'suspended' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        title={buyer.status === 'suspended' ? "Re-activate" : "Suspend"}
                      >
                        <ShieldAlert className={`w-5 h-5 ${actionLoading === buyer.id ? 'animate-pulse' : ''}`} />
                      </button>
                      <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-black hover:text-white transition-all">
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

export default BuyerManagement;
