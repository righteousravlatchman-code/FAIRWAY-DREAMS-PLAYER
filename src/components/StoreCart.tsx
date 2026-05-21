import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Trash2, Plus, Minus, CreditCard, ArrowRight, ShieldCheck, Truck, RotateCcw, Package } from 'lucide-react';
import { CartItem, ThemeColors } from '../types';

interface StoreCartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, size?: string, color?: string) => void;
  onRemoveFromCart: (productId: string, size?: string, color?: string) => void;
  onCheckout: () => void;
  theme: ThemeColors;
}

export const StoreCart: React.FC<StoreCartProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckout,
  theme
}) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment'>('cart');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[120] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold/10 text-gold">
                  <ShoppingCart size={18} />
                </div>
                <h2 className="text-lg font-display text-white tracking-widest uppercase">Your Collection</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 text-zinc-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-white/5">
                    <Package className="text-zinc-700" size={24} />
                  </div>
                  <h3 className="text-white font-display tracking-widest uppercase mb-2">Collection Empty</h3>
                  <p className="text-zinc-500 text-xs max-w-[200px]">Synchronize your reality with our physical artifacts. Start exploring the store.</p>
                  <button 
                    onClick={onClose}
                    className="mt-8 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all"
                  >
                    Return to Store
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item, idx) => (
                    <motion.div 
                      key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group"
                    >
                      <img 
                        src={item.images[0]} 
                        alt={item.name} 
                        className="w-20 h-20 rounded-xl object-cover border border-white/5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-white text-xs font-bold uppercase tracking-widest truncate pr-2">{item.name}</h4>
                          <button 
                            onClick={() => onRemoveFromCart(item.id, item.selectedSize, item.selectedColor)}
                            className="text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-gold font-bold text-xs mb-3">${(item.price * item.quantity).toFixed(2)}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-black rounded-lg border border-white/10 p-1">
                            <button 
                              onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize, item.selectedColor)}
                              disabled={item.quantity <= 1}
                              className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-[10px] text-white font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize, item.selectedColor)}
                              className="p-1 text-zinc-500 hover:text-white"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          
                          {item.selectedSize && (
                            <span className="text-[8px] uppercase tracking-widest text-zinc-500">Size: {item.selectedSize}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-zinc-900/50 border-t border-white/10 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    <span>Protocol Shipping</span>
                    <span>{shipping === 0 ? 'COMPLIMENTARY' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between text-lg text-white font-display tracking-widest uppercase">
                    <span>Total Artifact Value</span>
                    <span className="text-gold">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[6px] uppercase tracking-widest text-zinc-500">Secure</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-4 border-x border-white/5">
                    <Truck size={14} className="text-gold" />
                    <span className="text-[6px] uppercase tracking-widest text-zinc-500">Fast Drop</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <RotateCcw size={14} className="text-blue-500" />
                    <span className="text-[6px] uppercase tracking-widest text-zinc-500">Returns</span>
                  </div>
                </div>

                <button 
                  onClick={onCheckout}
                  className="w-full py-5 bg-gold text-black text-[10px] uppercase tracking-widest font-black rounded-2xl hover:bg-white transition-all group flex items-center justify-center gap-3"
                >
                  Confirm Frequency Transaction
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
