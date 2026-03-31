import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TrainerProfile, UserProfile } from '../types';
import TrainerCard from '../components/trainer/TrainerCard';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Browse = () => {
  const [trainers, setTrainers] = useState<(TrainerProfile & { displayName: string; photoURL?: string })[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [sortBy, setSortBy] = useState('Recommended');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchTaxonomies();
  }, []);

  useEffect(() => {
    const fetchTrainers = async () => {
      setLoading(true);
      try {
        const trainersSnap = await getDocs(query(collection(db, 'trainers'), where('isApproved', '==', true)));
        const trainersData = trainersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainerProfile));
        
        if (trainersData.length === 0) {
          setTrainers([]);
          setLoading(false);
          return;
        }

        // Fetch user profiles for display names in batches of 10
        const userIds = [...new Set(trainersData.map(t => t.userId))];
        const usersData: Record<string, UserProfile> = {};
        
        // Firestore 'in' query supports up to 10-30 items depending on version, let's do chunks of 10
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 10) {
          chunks.push(userIds.slice(i, i + 10));
        }

        await Promise.all(chunks.map(async (chunk) => {
          const userSnap = await getDocs(query(collection(db, 'users'), where('uid', 'in', chunk)));
          userSnap.forEach(doc => {
            usersData[doc.id] = doc.data() as UserProfile;
          });
        }));

        const combinedData = trainersData.map(t => ({
          ...t,
          displayName: usersData[t.userId]?.displayName || 'Unknown Trainer',
          photoURL: usersData[t.userId]?.photoURL,
        }));

        setTrainers(combinedData);
      } catch (error) {
        console.error("Error fetching trainers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = t.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === 'All' || t.sport === selectedSport;
    const matchesPrice = t.sessionPrice >= priceRange[0] && t.sessionPrice <= priceRange[1];
    return matchesSearch && matchesSport && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') return a.sessionPrice - b.sessionPrice;
    if (sortBy === 'Price: High to Low') return b.sessionPrice - a.sessionPrice;
    if (sortBy === 'Rating') return (b.rating || 0) - (a.rating || 0);
    return 0; // Recommended (default order)
  });

  const sports = ['All', ...categories.map(c => c.name)];

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gray-50 pt-20 pb-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight mb-8">Find your perfect coach</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by name, sport, or goal..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center px-6 py-4 border rounded-2xl font-medium transition-all ${
                showFilters ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" /> Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-8 grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100">
                    <h3 className="font-bold mb-4 flex items-center">
                      Price Range <span className="ml-2 text-gray-400 font-normal text-sm">${priceRange[0]} - ${priceRange[1]}</span>
                    </h3>
                    <input 
                      type="range" 
                      min="0" 
                      max="500" 
                      step="10"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-black"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                      <span>$0</span>
                      <span>$500+</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl border border-gray-100">
                    <h3 className="font-bold mb-4">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {sports.slice(1).map(sport => (
                        <button
                          key={sport}
                          onClick={() => setSelectedSport(sport === selectedSport ? 'All' : sport)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            selectedSport === sport 
                            ? 'bg-black text-white' 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {sport}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Sport Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-8 no-scrollbar">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedSport === sport 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[4/3] rounded-[32px] mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <p className="text-gray-500 font-medium">{filteredTrainers.length} coaches found</p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Sort by:</span>
                <select 
                  className="text-sm font-bold bg-transparent focus:outline-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option>Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Rating</option>
                </select>
              </div>
            </div>

            {filteredTrainers.length > 0 ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
                {filteredTrainers.map(trainer => (
                  <TrainerCard key={trainer.id} trainer={trainer} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">No coaches found</h3>
                <p className="text-gray-500">Try adjusting your filters or search term.</p>
                <button 
                  onClick={() => {setSearchTerm(''); setSelectedSport('All');}}
                  className="mt-6 text-black font-bold underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Browse;
