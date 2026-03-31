import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, doc, deleteDoc, updateDoc, getDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Search, Filter, Star, User, Trash2, ShieldCheck, ShieldAlert, MoreVertical, MessageSquare } from 'lucide-react';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'reviews'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch trainer and buyer names for each review
      const reviewsWithDetails = await Promise.all(reviewsData.map(async (review: any) => {
        const trainerDoc = await getDoc(doc(db, 'trainers', review.trainerId));
        const trainerData = trainerDoc.data();
        
        const trainerUserDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', trainerData?.userId)));
        const trainerName = trainerUserDoc.docs[0]?.data()?.displayName || 'Unknown Trainer';

        const buyerDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', review.buyerId)));
        const buyerName = buyerDoc.docs[0]?.data()?.displayName || 'Unknown Buyer';

        return { ...review, trainerName, buyerName };
      }));

      setReviews(reviewsWithDetails);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleHide = async (id: string, currentHidden: boolean) => {
    try {
      await updateDoc(doc(db, 'reviews', id), { isHidden: !currentHidden });
    } catch (error) {
      console.error("Error toggling review visibility:", error);
    }
  };

  const handleModeration = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reviews', id), { moderationStatus: status });
    } catch (error) {
      console.error("Error updating moderation status:", error);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000); // Reset after 3 seconds
      return;
    }

    try {
      await deleteDoc(doc(db, 'reviews', id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const filteredReviews = reviews.filter((r: any) => {
    const trainer = r.trainerName?.toLowerCase() || '';
    const buyer = r.buyerName?.toLowerCase() || '';
    const comment = r.comment?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return trainer.includes(search) || buyer.includes(search) || comment.includes(search);
  });

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Review Moderation</h1>
          <p className="text-gray-400 font-medium">Manage platform feedback and ensure quality.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">Review Guidelines</button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search reviews..." 
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
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Reviewer</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Trainer</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Rating</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Comment</th>
                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold">Loading...</td></tr>
              ) : filteredReviews.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold">No reviews found.</td></tr>
              ) : filteredReviews.map((review: any) => (
                <tr key={review.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-sm font-bold text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{review.buyerName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-sm font-bold text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{review.trainerName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleToggleHide(review.id, review.isHidden)}
                        className={`p-2 rounded-xl transition-colors ${review.isHidden ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        title={review.isHidden ? "Unhide Review" : "Hide Review"}
                      >
                        {review.isHidden ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(review.id)}
                        className={`p-2 rounded-xl transition-all ${confirmDelete === review.id ? 'bg-red-600 text-white scale-110' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} 
                        title={confirmDelete === review.id ? "Click again to confirm" : "Delete Review"}
                      >
                        <Trash2 className="w-5 h-5" />
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

export default ReviewManagement;
