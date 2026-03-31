import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  User, 
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  Video
} from 'lucide-react';

const TrainerManagement = ({ 
  pendingTrainers, 
  allTrainers, 
  loading, 
  handleApprove, 
  handleReject, 
  handleToggleVerify 
}: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>(pendingTrainers.length > 0 ? 'pending' : 'all');

  const filteredTrainers = (activeTab === 'all' ? allTrainers : pendingTrainers).filter((t: any) => {
    const name = t.user?.displayName?.toLowerCase() || '';
    const sport = t.sport?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch = name.includes(search) || sport.includes(search);
    const matchesSport = filterSport === 'All' || t.sport === filterSport;
    return matchesSearch && matchesSport;
  });

  const sports = ['All', ...new Set([...allTrainers, ...pendingTrainers].map((t: any) => t.sport))];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Trainer Management</h1>
          <p className="text-gray-400 font-medium">Manage applications, verification, and status.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">Export CSV</button>
          <button className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold shadow-lg shadow-black/10 hover:scale-105 transition-all">Add New Trainer</button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex bg-gray-50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              All Trainers ({allTrainers.length})
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'pending' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Pending ({pendingTrainers.length})
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search trainers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-6 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-gray-400 w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={filterSport}
                onChange={(e) => setFilterSport(e.target.value)}
                className="pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 transition-all outline-none appearance-none cursor-pointer"
              >
                {sports.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Trainer</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Category</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Experience</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Verification</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-bold">Loading...</td></tr>
              ) : filteredTrainers.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-bold">No trainers found.</td></tr>
              ) : filteredTrainers.map((trainer: any) => (
                <tr key={trainer.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shadow-sm">
                        {trainer.user?.photoURL ? (
                          <img src={trainer.user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="text-gray-300 w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-none mb-1">{trainer.user?.displayName || 'Unknown'}</h4>
                        <p className="text-xs text-gray-400 font-bold">{trainer.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-600">{trainer.sport}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-600">{trainer.experience} Years</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${trainer.isApproved ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      <span className={`text-xs font-black uppercase tracking-widest ${trainer.isApproved ? 'text-green-600' : 'text-orange-600'}`}>
                        {trainer.isApproved ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      {trainer.isVerified ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unverified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      {activeTab === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleApprove(trainer.id)}
                            className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleReject(trainer.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleToggleVerify(trainer.id, trainer.isVerified)}
                            className={`p-2 rounded-xl transition-colors ${trainer.isVerified ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            title={trainer.isVerified ? "Remove Verification" : "Verify Trainer"}
                          >
                            <ShieldCheck className="w-5 h-5" />
                          </button>
                          <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-black hover:text-white transition-all">
                            <ExternalLink className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 border-t border-gray-50 flex justify-between items-center">
          <p className="text-xs font-bold text-gray-400">Showing {filteredTrainers.length} of {activeTab === 'all' ? allTrainers.length : pendingTrainers.length} trainers</p>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-xs font-black hover:bg-gray-100 transition-all disabled:opacity-50" disabled>Previous</button>
            <button className="px-4 py-2 bg-black text-white rounded-xl text-xs font-black hover:scale-105 transition-all">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerManagement;
