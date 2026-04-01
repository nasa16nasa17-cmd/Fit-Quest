import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-6xl font-bold tracking-tighter mb-16">FitQuest Blog</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"
          >
            <h2 className="text-2xl font-bold mb-4">{post.title}</h2>
            <p className="text-gray-500 mb-6">{post.content.substring(0, 150)}...</p>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {new Date(post.createdAt).toLocaleDateString()} • {post.authorName}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Blog;
