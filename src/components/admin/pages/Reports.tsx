import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AlertTriangle, CheckCircle, Trash2, User, MessageSquare, Star, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  useEffect(() => {
    let q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
    
    if (filter !== 'all') {
      q = query(collection(db, 'reports'), where('status', '==', filter), orderBy('createdAt', 'desc'), limit(50));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleResolve = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error resolving report:", error);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="w-5 h-5 text-blue-500" />;
      case 'review': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Reports</h1>
          <p className="text-gray-500 font-bold">Manage user reports and platform safety.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {(['all', 'pending', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold mb-2">All clear!</h3>
          <p className="text-gray-500">No reports found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-6">
                  <div className="p-4 bg-gray-50 rounded-3xl group-hover:bg-white group-hover:shadow-inner transition-all">
                    {getIcon(report.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">{report.type} report</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        report.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{report.reason}</h3>
                    <p className="text-gray-500 mb-4 max-w-2xl">{report.description}</p>
                    <div className="flex items-center space-x-6 text-xs font-bold text-gray-400">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        By: {report.reporterName || 'Anonymous'}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {report.createdAt && format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {report.status !== 'resolved' && (
                    <button 
                      onClick={() => handleResolve(report.id)}
                      className="p-4 bg-green-50 text-green-600 rounded-3xl hover:bg-green-600 hover:text-white transition-all"
                      title="Mark as Resolved"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(report.id)}
                    className="p-4 bg-red-50 text-red-600 rounded-3xl hover:bg-red-600 hover:text-white transition-all"
                    title="Delete Report"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
