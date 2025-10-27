import { useState, useEffect } from 'react';
import { Calendar, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from "../createClient";

export default function SubscriptionCalendar({ user, activeSub, menuItems }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // Generate calendar days for the month
  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Fetch subscription orders for the month
  const fetchSubscriptionOrders = async () => {
    if (!user || !activeSub) return;
    
    setLoading(true);
    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('subscription_id', activeSub.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());
      
      if (error) throw error;
      setSubscriptionOrders(data || []);
    } catch (error) {
      console.error('Error fetching subscription orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add notification function
  const addNotification = (title, message, type = 'success') => {
    const id = Date.now();
    const newNotification = { id, title, message, timestamp: new Date(), type };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    
    const timeout = type === 'error' ? 8000 : type === 'order_update' ? 6000 : 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, timeout);
  };

  // Handle cancel request (opens modal)
  const handleCancelRequest = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existingOrder = subscriptionOrders.find(order => 
      order.created_at.split('T')[0] === dateStr && order.status !== 'cancelled'
    );

    // Get meal name for display
    const mealName = activeSub?.fooditems?.map(({ itemid }) => {
      const menuItem = menuItems.find(m => String(m.id) === String(itemid));
      return menuItem?.title;
    }).filter(Boolean).join(', ') || 'Subscription meal';

    setConfirmData({ date, existingOrder, mealName });
    setShowConfirmModal(true);
  };

  // Confirm cancellation (actual cancellation logic)
  // Replace this entire function
const confirmCancellation = async () => {
  if (!confirmData) return;
  
  const { date, existingOrder } = confirmData;
  const dateStr = date.toISOString().split('T')[0];
  
  if (existingOrder) {
    // Cancel existing order
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', existingOrder.id);
      
      if (error) throw error;
      
      setSubscriptionOrders(prev => 
        prev.map(order => 
          order.id === existingOrder.id 
            ? { ...order, status: 'cancelled' }
            : order
        )
      );
      
      addNotification('Meal Cancelled', `Meal for ${date.toLocaleDateString()} has been cancelled.`);
    } catch (error) {
      console.error('Error cancelling meal:', error);
      addNotification('Error', 'Failed to cancel meal. Please try again.', 'error');
    }
  } else {
    // Add to skipped_dates in subscriptions table
    try {
      const currentSkippedDates = activeSub.skipped_dates || [];
      const updatedSkippedDates = [...currentSkippedDates, dateStr];
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          skipped_dates: updatedSkippedDates 
        })
        .eq('id', activeSub.id);
      
      if (error) throw error;
      
      addNotification('Meal Skipped', `Meal for ${date.toLocaleDateString()} will be skipped.`);
    } catch (error) {
      console.error('Error skipping meal:', error);
      addNotification('Error', 'Failed to skip meal. Please try again.', 'error');
    }
  }
  
  setShowConfirmModal(false);
  setConfirmData(null);
};


  // Get order status for a specific date
  // Replace this entire function
const getDateStatus = (date) => {
  if (!activeSub) return null;
  
  const dateStr = date.toISOString().split('T')[0];
  const subStart = new Date(activeSub.start_date);
  const subEnd = new Date(activeSub.end_date);
  
  // Check if date is within subscription period
  if (date < subStart || date > subEnd) return null;
  
  // Check if date is in skipped dates
  const skippedDates = activeSub.skipped_dates || [];
  if (skippedDates.includes(dateStr)) return 'cancelled';
  
  const order = subscriptionOrders.find(order => 
    order.created_at.split('T')[0] === dateStr
  );
  
  return order ? order.status : 'scheduled';
};


  // Get status color and icon
  const getStatusDisplay = (status) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📅', label: 'Scheduled' },
      pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '⏳', label: 'Pending' },
      confirmed: { color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', label: 'Confirmed' },
      out_for_delivery: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🚚', label: 'Delivering' },
      delivered: { color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', label: 'Cancelled' }
    };
    
    return statusConfig[status] || statusConfig.scheduled;
  };

  // Confirmation Modal Component
  const ConfirmationModal = ({ isOpen, onClose, onConfirm, date, mealName }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold">Cancel Meal</h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Are you sure you want to cancel your meal for{' '}
            <span className="font-medium">{date?.toLocaleDateString()}</span>?
          </p>
          
          {mealName && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Meal:</span> {mealName}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Keep Meal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-white bg-red-500 rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              Cancel Meal
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchSubscriptionOrders();
  }, [selectedMonth, user, activeSub]);

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const currentMonth = selectedMonth.getMonth();

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-40 space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`
                p-4 rounded-lg shadow-lg max-w-sm border
                ${notif.type === 'error' 
                  ? 'bg-red-100 border-red-200 text-red-800' 
                  : 'bg-green-100 border-green-200 text-green-800'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-xs opacity-80 mt-1">{notif.message}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="ml-2 opacity-60 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Subscription Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <span className="font-medium min-w-[120px] text-center">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
          <p className="text-sm text-neutral-600">Loading calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const status = getDateStatus(date);
            const isCurrentMonth = date.getMonth() === currentMonth;
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today;
            const statusDisplay = status ? getStatusDisplay(status) : null;

            return (
              <div
                key={index}
                className={`
                  p-2 min-h-[60px] border rounded-lg relative transition-colors
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${!isCurrentMonth ? 'opacity-50' : ''}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {date.getDate()}
                </div>
                
                {status && isCurrentMonth && (
                  <div className={`text-xs px-2 py-1 rounded border ${statusDisplay.color}`}>
                    <div className="flex items-center justify-between gap-1">
                      <span title={statusDisplay.label}>{statusDisplay.icon}</span>
                      {status !== 'cancelled' && status !== 'delivered' && !isPast && (
                        <button
                          onClick={() => handleCancelRequest(date)}
                          className="hover:bg-red-200 rounded p-1 transition-colors"
                          title="Cancel this meal"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] leading-tight">
                      {statusDisplay.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">Status Legend:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Delivered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmData(null);
        }}
        onConfirm={confirmCancellation}
        date={confirmData?.date}
        mealName={confirmData?.mealName}
      />
    </div>
  );
}
