import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, CreditCard, Package, Star, ArrowRight, ShoppingCart, Tag, Filter, Info, ShieldCheck } from 'lucide-react';
import { Product, CartItem, ThemeColors } from '../types';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';

interface MerchStoreProps {
  theme: ThemeColors;
  cart: CartItem[];
  onAddToCart: (product: Product, size?: string, color?: string) => void;
  onRemoveFromCart: (productId: string, size?: string, color?: string) => void;
  onUpdateQuantity: (productId: string, delta: number, size?: string, color?: string) => void;
  onOpenCart: () => void;
}

export const MerchStore: React.FC<MerchStoreProps> = ({ 
  theme, 
  cart, 
  onAddToCart, 
  onRemoveFromCart, 
  onUpdateQuantity,
  onOpenCart
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', 'Apparel', 'Accessories', 'Digital', 'Vinyl'];

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(p);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="p-2 rounded-lg bg-gold/10 text-gold">
              <ShoppingBag size={20} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Frequency Merch</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display text-white tracking-widest uppercase"
          >
            Tactile <span className="text-gold">Vibrations</span>
          </motion.h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${
                  selectedCategory === cat ? 'bg-gold text-black font-bold' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <button 
            onClick={onOpenCart}
            className="relative p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-40">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full"
          />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-20 text-center">
          <Package className="mx-auto text-zinc-700 mb-6" size={48} />
          <h3 className="text-xl text-white font-display tracking-widest uppercase mb-2">Vault is Empty</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">The store is currently being restocked with new artifacts. Check back soon for the next drop.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-gold/30 transition-all duration-500"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-zinc-900">
                <img 
                  src={product.images[0] || 'https://picsum.photos/seed/product/400/400'} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                {/* Overlay Controls */}
                <div className="absolute inset-x-4 bottom-4 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 py-3 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded-xl hover:bg-gold transition-colors"
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => onAddToCart(product)}
                    className="p-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-gold hover:text-black transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="absolute top-4 left-4">
                  <span className="px-2 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-[8px] uppercase tracking-widest text-gold font-bold">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-white font-display tracking-widest uppercase text-sm truncate pr-4">{product.name}</h3>
                  <span className="text-gold font-bold text-sm">
                    ${product.price ? product.price.toFixed(2) : '0.00'}
                  </span>
                </div>
                <p className="text-zinc-500 text-[10px] line-clamp-2 leading-relaxed mb-4">{product.description}</p>
                
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className={i < 4 ? "text-gold" : "text-zinc-800"} fill={i < 4 ? "currentColor" : "none"} />
                  ))}
                  <span className="text-[8px] text-zinc-600 ml-2 uppercase tracking-widest">In Stock: {product.stock}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-zinc-500 hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">
                {/* Images */}
                <div className="md:w-1/2 bg-zinc-900 border-r border-white/5">
                  <div className="aspect-square relative">
                    <img 
                      src={selectedProduct.images[0] || 'https://picsum.photos/seed/product/600/600'} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {selectedProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 p-4">
                      {selectedProduct.images.map((img, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-white/5">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="md:w-1/2 p-8 md:p-12">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-gold/10 text-gold text-[10px] uppercase tracking-widest font-bold rounded-full">
                      {selectedProduct.category}
                    </span>
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full ${
                      selectedProduct.stock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {selectedProduct.stock > 0 ? 'Available' : 'Sold Out'}
                    </span>
                  </div>

                  <h2 className="text-4xl font-display text-white tracking-widest uppercase mb-4">{selectedProduct.name}</h2>
                  <p className="text-3xl text-gold font-bold mb-8">${selectedProduct.price?.toFixed(2)}</p>
                  
                  <div className="space-y-6 mb-10">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-bold">Description</h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">{selectedProduct.description}</p>
                    </div>

                    {selectedProduct.features && selectedProduct.features.length > 0 && (
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-bold">Artifact Details</h4>
                        <ul className="grid grid-cols-2 gap-y-2">
                          {selectedProduct.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-zinc-400 text-xs">
                              <div className="w-1 h-1 rounded-full bg-gold" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-bold">Select Dimension (Size)</h4>
                        <div className="flex gap-2">
                          {selectedProduct.sizes.map(size => (
                            <button
                              key={size}
                              className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-white text-xs hover:border-gold hover:text-gold transition-all"
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-white/10">
                    <button 
                      onClick={() => {
                        onAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="w-full py-5 bg-gold text-black text-xs uppercase tracking-widest font-black rounded-2xl hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Plus size={18} />
                      Add to Curation
                    </button>
                    <p className="text-center text-zinc-600 text-[8px] uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                      <ShieldCheck size={10} className="text-gold" />
                      Secure Frequency Transaction Guaranteed
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
