import React, { useState, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, Check, X, Info } from 'lucide-react';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const AdminHeader = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n: any) => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-50">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
          <input 
            type="text" 
            placeholder="Search trainers, bookings, or users..." 
            className="w-full pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-96 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden z-50">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-sm tracking-tight uppercase">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                {notifications.length > 0 ? notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-6 flex items-start space-x-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={`p-2 rounded-xl ${
                      notif.type === 'success' ? 'bg-green-100 text-green-600' : 
                      notif.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Info className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm leading-tight">{notif.title}</h4>
                        <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap ml-2">
                          {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                    <p className="text-sm text-gray-400 font-medium">No notifications yet.</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4 pl-6 border-l border-gray-100 group cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-black tracking-tight leading-none mb-1">Nasa Admin</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 leading-none">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden shadow-lg shadow-black/10">
            <User className="text-white w-5 h-5" />
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
