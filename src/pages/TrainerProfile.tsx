/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { TrainerProfile as ITrainerProfile, UserProfile, Review, Chat } from '../types';
import { Star, MapPin, Globe, CheckCircle, Calendar, MessageSquare, Award, Clock, ArrowRight, Play, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { loadStripe } from '@stripe/stripe-js';
import { format } from 'date-fns';
import BookingModal from '../components/trainer/BookingModal';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const TrainerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainer, setTrainer] = useState<ITrainerProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleMessage = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!trainer || !userProfile) return;

    setMessageLoading(true);
    try {
      // Create a deterministic chat ID
      const chatId = [user.uid, trainer.userId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        const newChat: Partial<Chat> = {
          participants: [user.uid, trainer.userId],
          trainerId: trainer.userId,
          clientId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          unreadCount: {
            [user.uid]: 0,
            [trainer.userId]: 0
          }
        };
        await setDoc(chatRef, newChat);
      }

      navigate(`/messages?chatId=${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start conversation.");
    } finally {
      setMessageLoading(false);
    }
  };

  const handleBookingConfirm = async (bookingData: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!trainer || !userProfile) return;

    setBookingLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingData,
          trainerId: trainer.userId,
          buyerId: user.uid,
          buyerName: user.displayName || user.email,
          trainerProfileId: trainer.id
        }),
      });

      const session = await response.json();
      
      if (session.url) {
        window.location.href = session.url;
      } else {
        const stripe = await stripePromise;
        if (stripe) {
          await (stripe as any).redirectToCheckout({ sessionId: session.id });
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to initiate booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const fetchTrainerData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const trainerDoc = await getDoc(doc(db, 'trainers', id));
        if (trainerDoc.exists()) {
          const tData = { id: trainerDoc.id, ...trainerDoc.data() } as ITrainerProfile;
          setTrainer(tData);
          
          const userDoc = await getDoc(doc(db, 'users', tData.userId));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }

          const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('trainerId', '==', id)));
          setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
        }
      } catch (error) {
        console.error("Error fetching trainer profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerData();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!trainer || !userProfile) return <div className="text-center py-32">Trainer not found</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* Banner */}
      <div className="h-64 md:h-96 relative overflow-hidden bg-gray-100">
        <img 
          src={trainer.bannerUrl || `https://picsum.photos/seed/${id}banner/1920/600`} 
          alt="Banner" 
          className="w-full h-full object-cover grayscale opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-20">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row md:items-end space-y-6 md:space-y-0 md:space-x-8 mb-12">
              <div className="w-40 h-40 rounded-[40px] overflow-hidden border-4 border-white shadow-xl bg-white">
                <img 
                  src={userProfile.photoURL || `https://picsum.photos/seed/${id}/400/400`} 
                  alt={userProfile.displayName} 
                  className="w-full h-full object-cover grayscale"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-4xl font-bold tracking-tight">{userProfile.displayName}</h1>
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                  {trainer.isVerified && (
                    <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </div>
                  )}
                </div>
                <p className="text-xl text-gray-500 font-medium mb-4">{trainer.sport} • {trainer.experience}y Experience</p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-black" /> {trainer.rating.toFixed(1)} ({trainer.reviewCount} reviews)
                  </span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> {trainer.successfulBookingsCount || 0} Successful Bookings
                  </span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> {trainer.location}
                  </span>
                  {trainer.memberSince && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Member since {format(new Date(trainer.memberSince), 'MMM yyyy')}
                    </span>
                  )}
                  {trainer.isOnline && (
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                      <Globe className="w-3 h-3 mr-1" /> Online Available
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs / Sections */}
            <div className="space-y-16">
              <section>
                <h2 className="text-2xl font-bold mb-6">About</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                  {trainer.bio}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6">Coaching Philosophy</h2>
                <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 italic text-gray-700 text-lg">
                  "{trainer.philosophy}"
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6">Specializations</h2>
                <div className="flex flex-wrap gap-3">
                  {trainer.specializations.map((spec, i) => (
                    <span key={i} className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
              </section>

              {trainer.videoUrl && (
                <section>
                  <h2 className="text-2xl font-bold mb-6">Introduction Video</h2>
                  <div className="aspect-video bg-black rounded-[40px] overflow-hidden shadow-2xl">
                    {trainer.videoUrl.includes('youtube.com') || trainer.videoUrl.includes('youtu.be') ? (
                      <iframe 
                        src={`https://www.youtube.com/embed/${trainer.videoUrl.split('v=')[1]?.split('&')[0] || trainer.videoUrl.split('/').pop()}`}
                        className="w-full h-full"
                        allowFullScreen
                        title="Intro Video"
                      />
                    ) : trainer.videoUrl.includes('vimeo.com') ? (
                      <iframe 
                        src={`https://player.vimeo.com/video/${trainer.videoUrl.split('/').pop()}`}
                        className="w-full h-full"
                        allowFullScreen
                        title="Intro Video"
                      />
                    ) : (
                      <video 
                        src={trainer.videoUrl} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </section>
              )}

              <section>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Reviews</h2>
                  <div className="flex items-center text-xl font-bold">
                    <Star className="w-6 h-6 fill-black mr-2" /> {trainer.rating.toFixed(1)}
                  </div>
                </div>
                <div className="space-y-8">
                  {reviews.filter(r => !r.isHidden).length > 0 ? reviews.filter(r => !r.isHidden).map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-8">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                          {review.buyerName?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <h4 className="font-bold">{review.buyerName || 'Anonymous Athlete'}</h4>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  )) : (
                    <p className="text-gray-400 italic">No reviews yet.</p>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white border border-gray-100 rounded-[40px] shadow-2xl p-8 overflow-hidden relative">
                <div className="mb-8">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Starting from</span>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">${trainer.sessionPrice}</span>
                    <span className="text-gray-400 ml-2">/session</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-3 text-black" />
                    <span>60 minute sessions</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-3 text-black" />
                    <span>Certified Professional</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ShieldCheck className="w-4 h-4 mr-3 text-black" />
                    <span>FitQuest Verified</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setIsBookingModalOpen(true)}
                    disabled={bookingLoading}
                    className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {bookingLoading ? 'Processing...' : 'Book a Session'} <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                  {trainer.monthlyPlanPrice && (
                    <button 
                      onClick={() => setIsBookingModalOpen(true)}
                      disabled={bookingLoading}
                      className="w-full py-5 border border-black text-black rounded-2xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      {bookingLoading ? 'Processing...' : `Monthly Plan ($${trainer.monthlyPlanPrice}/mo)`}
                    </button>
                  )}
                  <button 
                    onClick={handleMessage}
                    disabled={messageLoading}
                    className="w-full py-5 text-gray-500 font-bold hover:text-black transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" /> {messageLoading ? 'Starting chat...' : `Message ${userProfile.displayName?.split(' ')[0]}`}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                  Free cancellation up to 24h before session
                </p>
              </div>

              <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100">
                <h4 className="font-bold mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2" /> Achievements
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg">🏆</div>
                    <span className="text-sm font-medium">Top Rated Coach 2025</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg">⚡</div>
                    <span className="text-sm font-medium">Fast Responder</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg">🔥</div>
                    <span className="text-sm font-medium">500+ Sessions Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        trainer={trainer}
        trainerUser={userProfile}
        onConfirm={handleBookingConfirm}
        loading={bookingLoading}
      />
    </div>
  );
};

export default TrainerProfile;
