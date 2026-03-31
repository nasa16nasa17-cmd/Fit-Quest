import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Review } from '../../types';
import { Star, MessageSquare, Calendar, User as UserIcon, ShieldCheck, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const TrainerReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reviews'),
      where('trainerId', '==', user.uid),
      where('isHidden', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const reviewsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(reviewsData);

      if (reviewsData.length > 0) {
        const total = reviewsData.reduce((acc, r) => acc + r.rating, 0);
        const avg = total / reviewsData.length;
        
        const counts = {
          fiveStar: reviewsData.filter(r => r.rating === 5).length,
          fourStar: reviewsData.filter(r => r.rating === 4).length,
          threeStar: reviewsData.filter(r => r.rating === 3).length,
          twoStar: reviewsData.filter(r => r.rating === 2).length,
          oneStar: reviewsData.filter(r => r.rating === 1).length
        };

        setStats({
          averageRating: avg,
          totalReviews: reviewsData.length,
          ...counts
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="py-20 text-center text-gray-400 font-bold">Loading reviews...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Reviews</h1>
          <p className="text-gray-500">What your athletes are saying about your coaching.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="text-xl font-bold">{stats.averageRating.toFixed(1)}</span>
          <span className="text-gray-400 font-medium">/ 5.0</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Rating Distribution</h3>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats[`${['zero', 'one', 'two', 'three', 'four', 'five'][star]}Star` as keyof typeof stats] as number;
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 w-12">
                      <span className="text-sm font-bold">{star}</span>
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-xs text-gray-400 font-bold">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-black text-white p-8 rounded-[40px] shadow-xl shadow-black/10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Growth Tip</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Coaches with at least 10 reviews and a 4.8+ rating see 3x more booking requests. Keep up the great work!
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Feedback</h2>
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Verified Reviews</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="p-8 hover:bg-gray-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{review.buyerName}</h4>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.comment}</p>
                  <div className="flex items-center space-x-4">
                    <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                      Report
                    </button>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-32 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No reviews yet</h3>
                  <p className="text-gray-500">Reviews will appear here once your athletes complete sessions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerReviews;
