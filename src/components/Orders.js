import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check, X, Truck, Eye, Phone, MapPin } from "lucide-react";
import { supabase } from '../createClient';

const STATUS_CONFIG = {
  pending: { 
    label: "Pending", 
    color: "bg-amber-50 text-amber-800 border-amber-200", 
    icon: Clock 
  },
  confirmed: { 
    label: "Confirmed", 
    color: "bg-blue-50 text-blue-800 border-blue-200", 
    icon: Check 
  },
  out_for_delivery: { 
    label: "Out for Delivery", 
    color: "bg-purple-50 text-purple-800 border-purple-200", 
    icon: Truck 
  },
  delivered: { 
    label: "Delivered", 
    color: "bg-emerald-50 text-emerald-800 border-emerald-200", 
    icon: Check 
  },
  cancelled: { 
    label: "Cancelled", 
    color: "bg-red-50 text-red-800 border-red-200", 
    icon: X 
  }
};

export default function OrdersPage({ setPage }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        (payload) => {
          console.log('Real-time update:', payload);
          fetchOrders(); // Refetch orders on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state immediately for better UX
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusActions = (order) => {
    const { status } = order;
    const actions = [];

    if (status === 'pending') {
      actions.push(
        { label: 'Confirm', status: 'confirmed', color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl' },
        { label: 'Cancel', status: 'cancelled', color: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl' }
      );
    } else if (status === 'confirmed') {
      actions.push(
        { label: 'Out for Delivery', status: 'out_for_delivery', color: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl' },
        { label: 'Cancel', status: 'cancelled', color: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl' }
      );
    } else if (status === 'out_for_delivery') {
      actions.push(
        { label: 'Mark Delivered', status: 'delivered', color: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl' }
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
          <p className="text-slate-700 mt-4 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-screen-lg mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => setPage("menu")}
            className="h-11 w-11 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 grid place-items-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          >
            <span className="text-lg font-bold text-slate-700">←</span>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Orders Dashboard</h1>
            <p className="text-sm text-slate-600">Manage all incoming orders</p>
          </div>
          <div className="text-right bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg font-bold text-slate-900">{orders.length}</p>
            <p className="text-xs text-slate-500">Total Orders</p>
          </div>
          <div className="text-right bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
            <p className="text-lg font-bold text-amber-800">{orders.filter(o => o.status === 'pending').length}</p>
            <p className="text-xs text-amber-600">Pending</p>
          </div>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-6 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="font-bold text-2xl text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-600 max-w-md mx-auto">New orders will appear here in real-time. Start by placing your first order!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {orders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const actions = getStatusActions(order);

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-slate-900">Order #{order.id}</h3>
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${statusConfig.color}`}>
                              <StatusIcon className="h-4 w-4" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{formatTime(order.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="text-right bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <p className="text-2xl font-bold text-slate-900">₹{order.total_price}</p>
                          <p className="text-sm text-slate-600">{order.total_calories} kcal</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    {(order.phone || order.delivery_address) && (
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                        <div className="grid gap-4 md:grid-cols-2">
                          {order.phone && (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-blue-100 grid place-items-center">
                                <Phone className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</p>
                                <p className="font-semibold text-slate-900">{order.phone}</p>
                              </div>
                            </div>
                          )}
                          {order.delivery_address && (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-emerald-100 grid place-items-center">
                                <MapPin className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Address</p>
                                <p className="font-semibold text-slate-900">{order.delivery_address}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="px-6 py-5">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        className="flex items-center gap-3 text-slate-700 hover:text-slate-900 transition-colors font-semibold mb-4 group"
                      >
                        <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 grid place-items-center transition-colors">
                          <Eye className="h-5 w-5" />
                        </div>
                        <span>View {order.items?.length || 0} Items</span>
                        <motion.span 
                          animate={{ rotate: selectedOrder === order.id ? 90 : 0 }}
                          className="text-slate-400 ml-auto text-lg"
                        >
                          ▶
                        </motion.span>
                      </button>

                      <AnimatePresence>
                        {selectedOrder === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 border border-slate-200">
                              <div className="space-y-4">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div>
                                      <p className="font-semibold text-slate-900">{item.title}</p>
                                      <p className="text-sm text-slate-600">Quantity: {item.qty}</p>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900">₹{item.price * item.qty}</p>
                                  </div>
                                )) || <p className="text-slate-500 text-center py-4">No items data available</p>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action Buttons */}
                    {actions.length > 0 && (
                      <div className="px-6 pb-6">
                        <div className="flex gap-3 flex-wrap">
                          {actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => updateOrderStatus(order.id, action.status)}
                              disabled={updating === order.id}
                              className={`px-6 py-3 rounded-2xl text-white font-semibold transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                            >
                              {updating === order.id ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                  <span>Updating...</span>
                                </div>
                              ) : (
                                action.label
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
