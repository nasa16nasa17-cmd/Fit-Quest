import React, { useState } from 'react';
import { Video, CheckCircle, XCircle, Star, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, increment, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import ReviewForm from '../reviews/ReviewForm';

interface BookingActionsProps {
  booking: Booking;
  userRole: 'trainer' | 'buyer' | 'admin';
  onStatusUpdate?: () => void;
}

const BookingActions: React.FC<BookingActionsProps> = ({ booking, userRole, onStatusUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!window.confirm(`Are you sure you want to mark this session as ${newStatus}?`)) return;
    
    setLoading(true);
    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      const updateData: any = {
        bookingStatus: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'completed') {
        updateData.completedAt = serverTimestamp();
        
        // Update trainer stats
        const trainerRef = doc(db, 'trainers', booking.trainerProfileId || '');
        await updateDoc(trainerRef, {
          sessionsCompleted: increment(1),
          successfulBookingsCount: increment(1)
        });
      }

      await updateDoc(bookingRef, updateData);

      // Notify buyer
      if (newStatus === 'completed' || newStatus === 'no_show') {
        await addDoc(collection(db, 'notifications'), {
          userId: booking.buyerId,
          title: newStatus === 'completed' ? 'Session Completed!' : 'Session Marked as No-Show',
          message: newStatus === 'completed' 
            ? `Your session with ${booking.trainerName} has been marked as completed. Please leave a review!`
            : `Your session with ${booking.trainerName} was marked as a no-show.`,
          type: newStatus === 'completed' ? 'success' : 'warning',
          link: '/dashboard',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      onStatusUpdate?.();
    } catch (error) {
      console.error("Error updating booking status:", error);
    } finally {
      setLoading(false);
    }
  };

  const canJoin = (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'upcoming') && booking.meetingLink;
  const canComplete = (userRole === 'trainer' || userRole === 'admin') && 
                    (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'upcoming');
  const canReview = userRole === 'buyer' && booking.bookingStatus === 'completed' && !booking.isReviewed;
  const canMarkNoShow = userRole === 'admin' && (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'upcoming');

  return (
    <div className="flex flex-wrap gap-2">
      {canJoin && (
        <a 
          href={booking.meetingLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
        >
          <Video className="w-4 h-4" />
          <span>Join Session</span>
        </a>
      )}

      {canComplete && (
        <button
          disabled={loading}
          onClick={() => handleStatusUpdate('completed')}
          className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/10"
        >
          <CheckCircle className="w-4 h-4" />
          <span>{loading ? 'Updating...' : 'Mark Completed'}</span>
        </button>
      )}

      {canMarkNoShow && (
        <button
          disabled={loading}
          onClick={() => handleStatusUpdate('no_show')}
          className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/10"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Mark No-Show</span>
        </button>
      )}

      {canReview && (
        <button
          onClick={() => setIsReviewModalOpen(true)}
          className="flex items-center space-x-2 bg-yellow-400 text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/10"
        >
          <Star className="w-4 h-4" />
          <span>Leave Review</span>
        </button>
      )}

      <ReviewForm 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        bookingId={booking.id}
        trainerId={booking.trainerId}
        trainerProfileId={booking.trainerProfileId || ''}
        trainerName={booking.trainerName || 'your trainer'}
        onSuccess={() => onStatusUpdate?.()}
      />
    </div>
  );
};

export default BookingActions;
