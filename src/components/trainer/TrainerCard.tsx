import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Globe, CheckCircle, ShieldCheck } from 'lucide-react';
import { TrainerProfile } from '../../types';

interface TrainerCardProps {
  trainer: TrainerProfile & { displayName: string; photoURL?: string };
}

const TrainerCard: React.FC<TrainerCardProps> = ({ trainer }) => {
  return (
    <Link 
      to={`/trainer/${trainer.id}`}
      className="bg-white rounded-[32px] overflow-hidden border border-gray-100 group hover:shadow-xl transition-all duration-500 flex flex-col h-full"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img 
          src={trainer.photoURL || `https://picsum.photos/seed/${trainer.id}/600/800`} 
          alt={trainer.displayName} 
          className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <div className="flex space-x-2">
            {trainer.isOnline && (
              <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center">
                <Globe className="w-3 h-3 mr-1" /> Online
              </span>
            )}
            {trainer.isInPerson && (
              <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center">
                <MapPin className="w-3 h-3 mr-1" /> In-person
              </span>
            )}
          </div>
          {trainer.isVerified && (
            <span className="bg-green-500/90 text-white backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center w-fit">
              <ShieldCheck className="w-3 h-3 mr-1" /> Verified
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold flex items-center">
              {trainer.displayName}
              <CheckCircle className="w-4 h-4 ml-1 text-blue-500" />
            </h3>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{trainer.sport}</p>
          </div>
          <div className="flex items-center text-sm font-bold">
            <Star className="w-4 h-4 fill-black mr-1" /> {(trainer.rating || 0).toFixed(1)}
          </div>
        </div>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow">
          {trainer.bio}
        </p>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
          <div>
            <span className="text-xl font-bold">${trainer.sessionPrice}</span>
            <span className="text-gray-400 text-xs font-normal">/session</span>
          </div>
          <div className="text-xs text-gray-400 font-medium">
            {trainer.experience}y experience
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TrainerCard;
