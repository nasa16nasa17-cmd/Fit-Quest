import React, { useState } from 'react';
import { Star, X, Send, CheckCircle2 } from 'lucide-react';
import { doc, addDoc, collection, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  trainerId: string;
  trainerProfileId: string;
  trainerName: string;
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  isOpen,
  onClose,
  bookingId,
  trainerId,
  trainerProfileId,
  trainerName,
  onSuccess
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setLoading(true);
    try {
      // 1. Create review
      await addDoc(collection(db, 'reviews'), {
        bookingId,
        trainerId: trainerProfileId,
        buyerId: user.uid,
        buyerName: user.displayName || 'Anonymous',
        rating,
        comment,
        isFlagged: false,
        isHidden: false,
        moderationStatus: 'pending',
        createdAt: serverTimestamp(),
      });

      // 2. Update trainer stats (simplified average calculation)
      const trainerRef = doc(db, 'trainers', trainerProfileId);
      await updateDoc(trainerRef, {
        reviewCount: increment(1),
        // In a real app, use a Cloud Function for accurate average rating
      });

      // 3. Update booking
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        isReviewed: true
      });

      // 4. Notify trainer
      await addDoc(collection(db, 'notifications'), {
        userId: trainerId,
        title: 'New Review Received!',
        message: `${user.displayName || 'An athlete'} left you a ${rating}-star review.`,
        type: 'success',
        link: '/dashboard/reviews',
        read: false,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold tracking-tight">Review your session</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Thank you!</h3>
                <p className="text-gray-500">Your review helps the community grow.</p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <div className="text-center">
                  <p className="text-gray-500 mb-4 font-medium">How was your session with <span className="text-black font-bold">{trainerName}</span>?</p>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                      >
                        <Star 
                          className={`w-10 h-10 ${
                            (hover || rating) >= star 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-200'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Your Feedback</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like? What could be improved?"
                    className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-black rounded-3xl min-h-[150px] outline-none transition-all resize-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center shadow-xl shadow-black/10 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Review'} <Send className="ml-2 w-5 h-5" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewForm;
