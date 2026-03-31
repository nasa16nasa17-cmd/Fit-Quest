import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Plus, Edit2, Trash2, Layers, Activity, Target, Zap, Heart, Brain, Dumbbell } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: 'Activity' });

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;

    try {
      await addDoc(collection(db, 'categories'), {
        ...newCategory,
        createdAt: new Date().toISOString()
      });
      setNewCategory({ name: '', description: '', icon: 'Activity' });
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'categories', id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const icons: any = {
    Activity, Target, Zap, Heart, Brain, Dumbbell, Layers
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Category Management</h1>
          <p className="text-gray-400 font-medium">Define sports types and coaching categories.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50">
            <h2 className="text-xl font-bold">Active Categories</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-20 text-center text-gray-400 font-bold">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="p-20 text-center text-gray-400 font-bold">No categories defined.</div>
            ) : categories.map((category) => {
              const Icon = icons[category.icon] || Activity;
              return (
                <div key={category.id} className="p-8 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center space-x-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{category.name}</h4>
                      <p className="text-sm text-gray-400 font-medium">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className={`p-3 rounded-2xl transition-all ${confirmDelete === category.id ? 'bg-red-600 text-white scale-110' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      title={confirmDelete === category.id ? "Click again to confirm" : "Delete Category"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm h-fit sticky top-28">
          <h3 className="text-xl font-black tracking-tight mb-8">Add New Category</h3>
          <form onSubmit={handleAddCategory} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Name</label>
              <input 
                type="text" 
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="e.g. Combat Sports"
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
              <textarea 
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                placeholder="Brief description..."
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none h-32 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Icon</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(icons).map(iconName => {
                  const Icon = icons[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setNewCategory({...newCategory, icon: iconName})}
                      className={`p-4 rounded-xl flex items-center justify-center transition-all ${newCategory.icon === iconName ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-black text-white rounded-2xl text-sm font-black shadow-lg shadow-black/10 hover:scale-105 transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Category</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
