import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, X, ChevronDown, Search, CheckCircle, User, LogOut, History, Bell } from "lucide-react";
import {supabase} from '../createClient'

// --- Sample Menu Data ---
const MENU = [
  {
    id: "m1",
    title: "Peri-Peri Paneer Wrap",
    img: "https://b.zmtcdn.com/data/pictures/4/20108014/9adc38d7f21038ea6b62971df17c0ac2_o2_featured_v2.jpg?output-format=webp",
    category: "Wraps",
    description: "Smoky peri-peri paneer, crunchy lettuce, onions, and mint mayo wrapped in a whole wheat tortilla.",
    calories: 420,
    protein: 22,
    carbs: 48,
    fats: 16,
    price: 249,
  },
  {
    id: "m2",
    title: "Classic Chicken Bowl",
    img: "https://easyfamilyrecipes.com/wp-content/uploads/2025/01/Southwest-Chicken-Bowl-Recipe.jpg",
    category: "Bowls",
    description: "Grilled chicken on herbed brown rice with roasted veggies and tangy house sauce.",
    calories: 520,
    protein: 36,
    carbs: 55,
    fats: 18,
    price: 329,
  },
  {
    id: "m3",
    title: "Veggie Buddha Bowl",
    img: "https://www.simplysissom.com/wp-content/uploads/2019/07/Healthy-Burrito-Bowls-With-Cilantro-Lime-Dressing-FI-1.jpg",
    category: "Bowls",
    description: "Quinoa, chickpeas, avocado, cherry tomato, cucumber, and tahini drizzle.",
    calories: 460,
    protein: 17,
    carbs: 62,
    fats: 14,
    price: 299,
  },
  {
    id: "m4",
    title: "Margherita Square",
    img: "https://images.immediate.co.uk/production/volatile/sites/30/2020/08/recipe-image-legacy-id-925468_10-9c3c06f.jpg",
    category: "Pizzas",
    description: "Crispy square pizza with San Marzano tomato, fresh mozzarella, and basil.",
    calories: 610,
    protein: 24,
    carbs: 72,
    fats: 22,
    price: 349,
  },
  {
    id: "m5",
    title: "Grilled Salmon Box",
    img: "https://meshiagare.tokyo/wp-content/uploads/2019/09/shakeben02.jpg",
    category: "Mains",
    description: "Teriyaki glazed salmon, jasmine rice, sautéed greens, sesame seeds.",
    calories: 540,
    protein: 34,
    carbs: 50,
    fats: 20,
    price: 459,
  },
  {
    id: "m6",
    title: "Protein Pancake Bites",
    img: "https://www.kingarthurbaking.com/sites/default/files/styles/featured_image/public/2021-08/Pancake-Bites_0437_.jpg?itok=6eRWuqbb",
    category: "Snacks",
    description: "Mini oat pancakes with whey, maple dip on the side.",
    calories: 300,
    protein: 19,
    carbs: 42,
    fats: 7,
    price: 179,
  },
  {
    id: "m7",
    title: "Hummus & Pita",
    img: "https://tablenspoon.com/wp-content/uploads/2018/11/IMG_2411.jpg",
    category: "Snacks",
    description: "Creamy hummus, paprika oil, warm pita triangles.",
    calories: 380,
    protein: 12,
    carbs: 46,
    fats: 14,
    price: 159,
  },
  {
    id: "m8",
    title: "Cold Coffee (No Sugar)",
    img: "https://www.heinens.com/content/uploads/2022/05/Mocha-Iced-Coffee-with-Vanilla-Cold-Foam-800x550-1.jpg",
    category: "Drinks",
    description: "Slow-brewed coffee shaken with milk and ice. Unsweetened by default.",
    calories: 90,
    protein: 6,
    carbs: 8,
    fats: 3,
    price: 129,
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(MENU.map((m) => m.category)))];

// Demo users for manual auth
const DEMO_USERS = [
  { id: "user1", email: "john@example.com", phone: "+919876543210", password: "password123", name: "John Doe" },
  { id: "user2", email: "jane@example.com", phone: "+919876543211", password: "password123", name: "Jane Smith" },
  { id: "demo", email: "demo@example.com", phone: "+919999999999", password: "demo", name: "Demo User" }
];

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800", icon: "⏳" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: "✅" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-purple-100 text-purple-800", icon: "🚚" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: "📦" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: "❌" }
};

export default function FoodOrderingApp({setPage}) {
  // Auth states
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App states
  const [step, setStep] = useState("menu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [descOpen, setDescOpen] = useState({});
  const [cartView, setCartView] = useState("items");
  const [deliveryAddress, setDeliveryAddress] = useState("Home - 123 Street, City");
  const [couponCode, setCouponCode] = useState("");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isConfirming, setIsConfirming] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);

  // Order history states
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);

  // Check for existing user session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setName(userData.name);
      setPhone(userData.phone);
    }
  }, []);

  // Set up real-time order status notifications
  // Enhanced real-time subscription
useEffect(() => {
  const insertMenuData = async () => {
  try {
    // First, check what items already exist in the database
    const { data: existingItems, error: fetchError } = await supabase
      .from('Food')
      .select('title');

    if (fetchError) throw fetchError;

    // Create a Set of existing titles for fast lookup
    const existingTitles = new Set(existingItems.map(item => item.title));

    // Filter out items that already exist
    const newItems = MENU.filter(item => !existingTitles.has(item.title));

    if (newItems.length === 0) {
      console.log('✅ All menu items already exist in database. No insertions needed.');
      return { success: true, message: 'No new items to insert', inserted: 0 };
    }

    console.log(`📝 Found ${newItems.length} new items to insert (${MENU.length - newItems.length} already exist)`);

    // Transform only the new items for database insertion
    const menuForDB = newItems.map(item => ({
      title: item.title,
      category: item.category,
      img: item.img,
      description: item.description,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
      price: item.price
    }));

    // Insert only the new items
    const { data, error } = await supabase
      .from('Food')
      .insert(menuForDB)
      .select();

    if (error) throw error;

    console.log(`✅ Successfully inserted ${data.length} new menu items!`);
    console.log('Inserted items:', data.map(item => item.title));
    
    return { 
      success: true, 
      data, 
      inserted: data.length,
      skipped: MENU.length - newItems.length
    };

  } catch (error) {
    console.error('❌ Error inserting menu data:', error);
    return { success: false, error };
  }
};

// insertMenuData();
  if (!user) return;

  const subscription = supabase
    .channel('user-orders-channel')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, 
      (payload) => {
        console.log('Order status updated:', payload);
        const { new: newOrder, old: oldOrder } = payload;
        
        if (newOrder.status !== oldOrder.status) {
          const statusConfig = STATUS_CONFIG[newOrder.status] || STATUS_CONFIG.pending;
          
          // Enhanced notification with special styling for order updates
          addNotification(
            `🎉 Order Update!`,
            `Order #${newOrder.id} is now ${statusConfig.label} ${statusConfig.icon}`,
            'order_update'
          );
          
          if (showOrderHistory) {
            fetchUserOrders();
          }
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user, showOrderHistory]);


  // Viewport setup
  useEffect(() => {
    const getItems = async () => {
      const { data, error } = await supabase.from('Food Items').select('*');
      console.log(data);
    }
    getItems()

    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    } else {
      const m = document.createElement("meta");
      m.name = "viewport";
      m.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
      document.head.appendChild(m);
    }
    document.body.style.touchAction = "manipulation";
  }, []);

  // Auth functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    setTimeout(() => {
      const foundUser = DEMO_USERS.find(u => 
        (u.email === loginData.identifier || u.phone === loginData.identifier) && 
        u.password === loginData.password
      );
      
      if (foundUser) {
        setUser(foundUser);
        setName(foundUser.name);
        setPhone(foundUser.phone);
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        setShowLogin(false);
        setLoginData({ identifier: "", password: "" });
        addNotification("Welcome back!", `Hello ${foundUser.name}, you're successfully logged in! 👋`);
      } else {
        alert("Invalid credentials!");
      }
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleLogout = () => {
    setUser(null);
    setName("");
    setPhone("");
    setCart({});
    localStorage.removeItem('currentUser');
    setShowOrderHistory(false);
    addNotification("Goodbye!", "You've been logged out successfully. See you soon! 👋");
  };

  // Enhanced notification with sound and better styling
const addNotification = (title, message, type = 'success') => {
  const id = Date.now();
  const newNotification = { id, title, message, timestamp: new Date(), type };
  setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
  
  // Play notification sound (optional)
  if (type === 'order_update') {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzqN0/LVgzMGKnPB7uOWRgwNZ7ng8qlLDwxMnuTuyV0cBzaL0/LVgzUGKnDA7eSUSQoLZLLm9KtLDgxDnuPuz1ogBTuJ0/LWgDYGJ2TA7eaUSwkJZLLm9KxNDg==');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  }
  
  // Auto-remove after 6 seconds for order updates (longer than regular notifications)
  setTimeout(() => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, type === 'order_update' ? 6000 : 5000);
};


  // Order history functions
  const fetchUserOrders = async () => {
    if (!user) return;
    
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserOrders(data || []);
    } catch (error) {
      console.error('Error fetching user orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const openOrderHistory = () => {
    setShowOrderHistory(true);
    fetchUserOrders();
  };

  // Updated confirm order function
  const confirmOrder = async () => {
    if (!user || cartList.length === 0) return;

    setIsConfirming(true);
    try {
      const orderData = {
        user_id: user.id,
        status: 'pending',
        items: cartList.map(item => ({
          item_id: item.id,
          title: item.title,
          qty: cart[item.id],
          price: item.price,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fats: item.fats
        })),
        total_price: Math.round(totals.price),
        total_calories: Math.round(totals.calories),
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
        phone: phone
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) throw error;

      setLastOrderId(data[0].id);
      setCart({});
      setShowCart(false);
      setCartView("items");
      setStep("orderSuccess");
      addNotification("Order Placed! 🎉", `Your order #${data[0].id} has been placed successfully!`);

    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const resetToMenu = () => {
    setStep("menu");
    setLastOrderId(null);
  };

  const canContinue = name.trim().length >= 2 && /^\+?\d{8,15}$/.test(phone.replace(/\s/g, ""));

  const itemsFiltered = useMemo(() => {
    const byCategory = category === "All" ? MENU : MENU.filter((i) => i.category === category);
    if (!query.trim()) return byCategory;
    const q = query.toLowerCase();
    return byCategory.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [category, query]);

  const cartList = useMemo(() => MENU.filter((i) => cart[i.id] > 0), [cart]);

  const totals = useMemo(() => {
    return cartList.reduce(
      (acc, item) => {
        const qty = cart[item.id] || 0;
        acc.items += qty;
        acc.calories += item.calories * qty;
        acc.protein += item.protein * qty;
        acc.carbs += item.carbs * qty;
        acc.fats += item.fats * qty;
        acc.price += item.price * qty;
        return acc;
      },
      { items: 0, calories: 0, protein: 0, carbs: 0, fats: 0, price: 0 }
    );
  }, [cartList, cart]);

  const increment = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const decrement = (id) =>
    setCart((c) => {
      const next = { ...c, [id]: Math.max((c[id] || 0) - 1, 0) };
      if (next[id] === 0) delete next[id];
      return next;
    });

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-black selection:text-white">
      {/* Notifications */}
      {/* Enhanced Notifications */}
<AnimatePresence>
  {notifications.map((notification) => (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, y: -50, x: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, x: 50, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`fixed top-20 right-4 z-50 rounded-2xl p-4 shadow-2xl max-w-sm border-2 ${
        notification.type === 'order_update' 
          ? 'bg-gradient-to-r from-blue-50 to-green-50 border-green-300' 
          : 'bg-white border-green-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-full grid place-items-center ${
          notification.type === 'order_update' 
            ? 'bg-gradient-to-r from-blue-100 to-green-100' 
            : 'bg-green-100'
        }`}>
          {notification.type === 'order_update' ? (
            <div className="relative">
              <Bell className="h-5 w-5 text-green-700" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: 3, duration: 0.5 }}
                className="absolute inset-0"
              >
                <Bell className="h-5 w-5 text-green-600" />
              </motion.div>
            </div>
          ) : (
            <Bell className="h-4 w-4 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <p className={`font-bold text-sm ${
            notification.type === 'order_update' ? 'text-green-800' : 'text-gray-800'
          }`}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-700 mt-1 font-medium">
            {notification.message}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          className="h-6 w-6 rounded-full hover:bg-gray-200 grid place-items-center"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>
    </motion.div>
  ))}
</AnimatePresence>


      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-neutral-200">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl place-items-center">
            <img src="https://raw.githubusercontent.com/Aryan-Motwani/food/refs/heads/main/WhatsApp%20Image%20sdsd-modified.png" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold leading-tight">Count Your Calories</h1>
            <p className="text-xs text-neutral-500">
              {user ? `Welcome back, ${user.name.split(' ')[0]}!` : "Healthy, tasty & fast"}
            </p>
          </div>
          
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={openOrderHistory}
                className="h-10 w-10 rounded-2xl border border-neutral-300 bg-white grid place-items-center"
                aria-label="Order History"
              >
                <History className="h-5 w-5" />
              </button>
              {step === "menu" && (
                <button
                  onClick={() => setShowCart(true)}
                  className="relative h-10 w-10 rounded-2xl border border-neutral-300 bg-white grid place-items-center"
                  aria-label="Open cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totals.items > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-black text-white text-xs grid place-items-center">
                      {totals.items}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="h-10 w-10 rounded-2xl border border-red-300 bg-red-50 grid place-items-center"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 text-red-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black text-white text-sm font-medium"
            >
              <User className="h-4 w-4" />
              Login
            </button>
          )}
        </div>
      </header>

      <main className="max-w-screen-sm mx-auto pb-28">
        {/* Login Required Message */}
        {!user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pt-8"
          >
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 text-center border border-blue-200">
              <div className="h-16 w-16 bg-blue-100 rounded-full grid place-items-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Count Your Calories</h2>
              <p className="text-gray-600 mb-6">Please login to start ordering healthy and delicious meals</p>
              <button
                onClick={() => setShowLogin(true)}
                className="px-6 py-3 bg-black text-white rounded-2xl font-semibold"
              >
                Login to Continue
              </button>
              <div className="mt-4 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-xs text-blue-700">
                  {/* <strong>Demo Login:</strong> demo@example.com / password: demo */}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Step 1: Info */}
            {step === "info" && (
              <motion.section
                key="info"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="px-4 pt-6"
              >
                <div className="rounded-3xl p-5 bg-white border border-neutral-200 shadow-sm">
                  <h2 className="text-xl font-semibold">Welcome 👋</h2>
                  <p className="text-sm text-neutral-600 mt-1">Tell us a bit about you to get started.</p>

                  <form
                    className="mt-4 grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (canContinue) setStep("menu");
                    }}
                  >
                    <label className="grid gap-1">
                      <span className="text-xs text-neutral-500">Name</span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="px-4 py-3 rounded-2xl border border-neutral-300 outline-none focus:ring-2 focus:ring-black"
                        placeholder="Your full name"
                        required
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs text-neutral-500">Phone</span>
                      <input
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="px-4 py-3 rounded-2xl border border-neutral-300 outline-none focus:ring-2 focus:ring-black"
                        placeholder="e.g. +9198xxxxxxx"
                        required
                      />
                      <span className="text-[11px] text-neutral-500">We'll contact you about your order if needed.</span>
                    </label>

                    <button
                      disabled={!canContinue}
                      className="mt-2 active:scale-[0.99] transition rounded-2xl bg-black text-white px-4 py-3 font-medium disabled:opacity-50"
                      type="submit"
                    >
                      Continue to Menu
                    </button>
                  </form>
                </div>
              </motion.section>
            )}

            {/* Step 2: Menu */}
            {step === "menu" && (
              <motion.section
                key="menu"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <div className="px-4 pt-4">
                  <h2 className="text-lg font-semibold">Hey {name.split(" ")[0] || user.name.split(" ")[0]} 👋</h2>
                  <p className="text-sm text-neutral-600">What are you craving today?</p>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setPage("myom")}
                      className="px-4 py-3 rounded-2xl bg-black text-white text-sm font-medium active:scale-[0.99]"
                    >
                      Make Your Own Meal
                    </button>
                    
                  </div>

                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-2xl border bg-white">
                    <Search className="h-5 w-5" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search dishes, categories..."
                      className="flex-1 outline-none bg-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="px-4 mt-4 overflow-x-auto no-scrollbar">
                  <div className="flex gap-2 w-max">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-2 rounded-2xl border text-sm whitespace-nowrap transition active:scale-[0.98] ${
                          category === cat ? "bg-black text-white border-black" : "bg-white border-neutral-300"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu Grid */}
                <div className="px-4 mt-4 grid grid-cols-1 gap-3">
                  <AnimatePresence>
                    {itemsFiltered.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex gap-3">
                          <img
                            src={item.img}
                            alt={item.title}
                            className="h-20 w-20 rounded-2xl object-cover object-center flex-shrink-0"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold truncate">{item.title}</h3>
                                <p className="text-xs text-neutral-500 mt-0.5">{item.category}</p>
                              </div>
                              {cart[item.id] ? (
                                <QtyControl
                                  qty={cart[item.id]}
                                  onDec={() => decrement(item.id)}
                                  onInc={() => increment(item.id)}
                                />
                              ) : (
                                <button
                                  onClick={() => increment(item.id)}
                                  className="px-3 py-1.5 text-sm rounded-xl bg-black text-white active:scale-[0.98]"
                                >
                                  Add
                                </button>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-600">
                              <span>🔥 {item.calories} kcal</span>
                              <span>🥚 {item.protein}g P</span>
                              <span>🌾 {item.carbs}g C</span>
                              <span>🧈 {item.fats}g F</span>
                              <span>₹ {item.price}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description toggle */}
                        <button
                          onClick={() =>
                            setDescOpen((d) => ({ ...d, [item.id]: !d[item.id] }))
                          }
                          className="mt-2 w-full flex items-center justify-center gap-1 text-sm text-neutral-700"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${descOpen[item.id] ? "rotate-180" : ""}`}
                          />
                          <span>Description</span>
                        </button>
                        <AnimatePresence initial={false}>
                          {descOpen[item.id] && (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="text-sm text-neutral-600 overflow-hidden px-1"
                            >
                              {item.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {itemsFiltered.length === 0 && (
                    <p className="text-center text-sm text-neutral-500 py-10">No items match your search.</p>
                  )}
                </div>
              </motion.section>
            )}

            {/* Step 3: Order Success */}
            {step === "orderSuccess" && (
              <motion.section
                key="orderSuccess"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="px-4 pt-16"
              >
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-green-100 grid place-items-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Order Placed! 🎉</h2>
                  <p className="text-neutral-600 mb-1">Your order has been successfully placed.</p>
                  {lastOrderId && (
                    <p className="text-sm text-neutral-500 mb-6">
                      Order ID: #{lastOrderId}
                    </p>
                  )}
                  
                  <div className="grid gap-3 mt-8">
                    <button
                      onClick={resetToMenu}
                      className="px-6 py-3 rounded-2xl bg-black text-white font-medium active:scale-[0.99]"
                    >
                      Order More
                    </button>
                    <button
                      onClick={() => setPage("orders")}
                      className="px-6 py-3 rounded-2xl border border-neutral-300 font-medium active:scale-[0.99]"
                    >
                      View Order Status
                    </button>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogin(false)} />
            <div className="flex items-center justify-center min-h-full p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="h-16 w-16 bg-black rounded-full grid place-items-center mx-auto mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Welcome Back</h2>
                  <p className="text-sm text-neutral-600">Login to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email or Phone
                    </label>
                    <input
                      type="text"
                      value={loginData.identifier}
                      onChange={(e) => setLoginData(prev => ({ ...prev, identifier: e.target.value }))}
                      placeholder="demo@example.com or +919999999999"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black outline-none"
                      required
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black outline-none"
                      required
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                    <p className="text-xs text-blue-700 text-center">
                      <strong>Demo Credentials:</strong><br/>
                      Email: demo@example.com<br/>
                      Password: demo
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-black text-white rounded-2xl font-semibold disabled:opacity-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLogin(false);
                    }}
                    className="w-full py-2 text-neutral-600 text-sm"
                  >
                    Cancel
                  </button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order History Modal */}
      <AnimatePresence>
        {showOrderHistory && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowOrderHistory(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="absolute bottom-0 left-0 right-0 max-w-screen-sm mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Orders</h3>
                <button
                  onClick={() => setShowOrderHistory(false)}
                  className="h-8 w-8 rounded-full grid place-items-center border"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                    <p className="text-sm text-neutral-600">Loading your orders...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-neutral-100 grid place-items-center mx-auto mb-4">
                      📋
                    </div>
                    <p className="text-neutral-600">No orders yet</p>
                    <p className="text-sm text-neutral-500">Your order history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((order) => {
                      const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      return (
                        <div key={order.id} className="bg-white border border-neutral-200 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">Order #{order.id}</h4>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <span>{statusConfig.icon}</span>
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-neutral-600">
                            <span>{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                            <span className="font-semibold text-black">₹{order.total_price}</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            {order.items?.length || 0} items • {order.total_calories} kcal
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Cart Bar */}
      <AnimatePresence>
        {totals.items > 0 && step === "menu" && user && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 270, damping: 24 }}
            className="fixed bottom-4 left-0 right-0 z-40"
          >
            <div className="max-w-screen-sm mx-auto px-4">
              <button
                onClick={() => setShowCart(true)}
                className="w-full rounded-3xl shadow-lg bg-black text-white px-5 py-4 text-sm font-medium flex items-center justify-between active:scale-[0.99]"
              >
                <span>{totals.items} item{totals.items > 1 ? "s" : ""} • ₹ {totals.price}</span>
                <span className="inline-flex items-center gap-2">
                  View Cart <ShoppingCart className="h-5 w-5" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCart(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="absolute bottom-0 left-0 right-0 max-w-screen-sm mx-auto bg-white rounded-t-3xl shadow-2xl
                        flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between shrink-0">
                <h3 className="font-semibold">Your Cart</h3>
                <button
                  className="h-8 w-8 rounded-full grid place-items-center border"
                  onClick={() => setShowCart(false)}
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {cartList.length === 0 ? (
                    <p className="text-sm text-neutral-500">Your cart is empty.</p>
                  ) : (
                    cartList.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <img src={item.img} alt="" className="h-14 w-14 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-neutral-500">₹ {item.price}</p>
                        </div>
                        <QtyControl
                          qty={cart[item.id]}
                          onDec={() => decrement(item.id)}
                          onInc={() => increment(item.id)}
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t bg-neutral-50 space-y-4">
                  {cartView === "items" ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-2xl bg-white border p-3">
                          <p className="text-xs text-neutral-500">Calories</p>
                          <p className="text-lg font-semibold">{totals.calories} kcal</p>
                        </div>
                        <div className="rounded-2xl bg-white border p-3">
                          <p className="text-xs text-neutral-500">Protein</p>
                          <p className="text-lg font-semibold">{totals.protein} g</p>
                        </div>
                        <div className="rounded-2xl bg-white border p-3">
                          <p className="text-xs text-neutral-500">Carbs</p>
                          <p className="text-lg font-semibold">{totals.carbs} g</p>
                        </div>
                        <div className="rounded-2xl bg-white border p-3">
                          <p className="text-xs text-neutral-500">Fats</p>
                          <p className="text-lg font-semibold">{totals.fats} g</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-base font-semibold">Total • ₹ {totals.price}</p>
                        <button
                          onClick={() => setCartView("checkout")}
                          className="px-4 py-3 rounded-2xl bg-black text-white text-sm font-medium active:scale-[0.99]"
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-5 text-sm">
                        <div>
                          <label className="block font-medium text-neutral-700 mb-1">Delivery Address</label>
                          <select 
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black outline-none"
                          >
                            <option value="Home - 123 Street, City">Home - 123 Street, City</option>
                            <option value="Office - 456 Avenue, City">Office - 456 Avenue, City</option>
                            <option value="Other">Add new address...</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-medium text-neutral-700 mb-1">Coupon Code</label>
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Enter coupon"
                            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black outline-none"
                          />
                        </div>

                        <div>
                          <p className="font-medium text-neutral-700 mb-1">Delivery</p>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name="delivery" 
                                value="pickup"
                                checked={deliveryType === "pickup"}
                                onChange={(e) => setDeliveryType(e.target.value)}
                              /> Pickup
                            </label>
                            <label className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name="delivery" 
                                value="delivery"
                                checked={deliveryType === "delivery"}
                                onChange={(e) => setDeliveryType(e.target.value)}
                              /> Home Delivery
                            </label>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium text-neutral-700 mb-1">Payment</p>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name="payment" 
                                value="upi"
                                checked={paymentMethod === "upi"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                              /> UPI
                            </label>
                            <label className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name="payment" 
                                value="card"
                                checked={paymentMethod === "card"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                              /> Card
                            </label>
                            <label className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name="payment" 
                                value="cod"
                                checked={paymentMethod === "cod"}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                              /> Cash on Delivery
                            </label>
                          </div>
                        </div>

                        <div className="border-t pt-3 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹ {totals.price}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>- ₹ 0</span>
                          </div>
                          <div className="flex justify-between text-base font-semibold mt-1">
                            <span>Total</span>
                            <span>₹ {totals.price}</span>
                          </div>
                        </div>

                        <button 
                          onClick={confirmOrder}
                          disabled={isConfirming || cartList.length === 0}
                          className="w-full py-3 bg-black text-white rounded-2xl font-medium active:scale-[0.98] disabled:opacity-50"
                        >
                          {isConfirming ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Placing Order...
                            </div>
                          ) : (
                            "Confirm Order"
                          )}
                        </button>
                        <button
                          onClick={() => setCartView("items")}
                          className="w-full py-2 text-sm text-neutral-600"
                        >
                          ← Back to Cart
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-6" />
    </div>
  );
}

function QtyControl({ qty, onInc, onDec }) {
  return (
    <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-2 py-1">
      <button
        onClick={onDec}
        className="h-7 w-7 grid place-items-center rounded-lg border border-neutral-300 active:scale-95"
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-6 text-center text-sm font-medium">{qty}</span>
      <button
        onClick={onInc}
        className="h-7 w-7 grid place-items-center rounded-lg border border-neutral-300 active:scale-95"
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

const style = document.createElement("style");
style.textContent = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
document.head.appendChild(style);
