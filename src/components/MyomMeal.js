import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";

/**
 * Categories
 * - unit & baseAmount control the measurement & step (e.g., 100g, 1 tsp, 1 count)
 * - pricePerBase is the price for exactly baseAmount of any option within the category
 * - nutrition values in each option are defined PER baseAmount (so scaling is clean)
 */
const categories = [
  {
    name: "Protein",
    title: "Select a main protein",
    unit: "g",
    baseAmount: 100,
    pricePerBase: 120, // ₹ per 100g
    options: [
      { id: 1, name: "Chicken", calories: 200, protein: 30, carbs: 0, fat: 5, image: "https://foodfolksandfun.net/wp-content/uploads/2021/06/Best-Way-To-Grill-Chicken-Breasts.jpg" },
      { id: 2, name: "Paneer",  calories: 250, protein: 20, carbs: 10, fat: 15, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSojq2zBshtsAXKS1QwI9zrVvlIFMTpN-tcYw&s" },
    ],
  },
  {
    name: "Toppings",
    title: "Select toppings",
    unit: "g",
    baseAmount: 50,
    pricePerBase: 40, // ₹ per 50g
    options: [
      { id: 3, name: "Carrots",  calories: 41,  protein: 1, carbs: 10, fat: 0, image: "https://thescattymum.com/wp-content/uploads/2023/05/how-to-make-carrot-sticks-1200.jpg" },
      { id: 4, name: "Avocado",  calories: 160, protein: 2, carbs: 9,  fat: 15, image: "https://www.yummymummykitchen.com/wp-content/uploads/2021/01/how-to-cut-avocado-03-720x540.jpg" },
      { id: 5, name: "Chillies", calories: 40,  protein: 1, carbs: 9,  fat: 0,  image: "https://www.shutterstock.com/image-photo/falling-sliced-red-hot-chili-600nw-2176842815.jpg" },
    ],
  },
  {
    name: "Sauce",
    title: "Select a sauce",
    unit: "tsp",
    baseAmount: 1,
    pricePerBase: 10, // ₹ per tsp
    options: [
      { id: 6, name: "BBQ Sauce",    calories: 29, protein: 0, carbs: 7, fat: 0, image: "https://easyfamilyrecipes.com/wp-content/uploads/2021/02/Homemade-BBQ-Sauce-Recipe.jpg" },
      { id: 7, name: "Chilli Sauce", calories: 25, protein: 0, carbs: 6, fat: 0, image: "https://www.thebutterhalf.com/wp-content/uploads/2023/02/Chili-Sauce-6-500x500.jpg" },
    ],
  },
  {
    name: "Extras",
    title: "Select extras",
    unit: "",
    baseAmount: 1,
    pricePerBase: 25, // ₹ per count
    options: [
      { id: 9,  name: "Egg",          calories: 70,  protein: 6, carbs: 1, fat: 5, image: "https://www.foodtasticmom.com/wp-content/uploads/2016/10/easyeggs-feature.jpg" },
      { id: 10, name: "Cheese Slice", calories: 110, protein: 7, carbs: 1, fat: 9, image: "https://superbutcher.com.au/cdn/shop/files/62172-1-1540_1080x.jpg?v=1708927106" },
    ],
  },
];

export default function MyomMeal() {
  const [currentCategory, setCurrentCategory] = useState(0);

  // Cart store: by category name we keep { option, qty }
  const [cart, setCart] = useState({}); // { [catName]: { option, qty } }

  // Drawers
  const [showCart, setShowCart] = useState(false);
  const [cartView, setCartView] = useState("items"); // "items" | "checkout"

  // Quantity drawer state
  const [showQty, setShowQty] = useState(false);
  const [pendingPick, setPendingPick] = useState(null); // { categoryIndex, option }
  const [pendingQty, setPendingQty] = useState(0);

  // Lock background scroll whenever a drawer is open
  useEffect(() => {
    const open = showCart || showQty;
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "manipulation";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "manipulation";
    };
  }, [showCart, showQty]);

  // Handle selecting an option → open quantity drawer first
  const handleOptionTap = (categoryIndex, option) => {
    const cat = categories[categoryIndex];
    setPendingPick({ categoryIndex, option });
    setPendingQty(cat.baseAmount); // default to baseAmount
    setShowQty(true);
  };

  const confirmQuantity = () => {
    if (!pendingPick) return;
    const { categoryIndex, option } = pendingPick;
    const cat = categories[categoryIndex];

    const qtyClean = Math.max(1, Number(pendingQty) || cat.baseAmount);
    setCart(prev => ({
      ...prev,
      [cat.name]: { option, qty: qtyClean }
    }));

    setShowQty(false);
    setPendingPick(null);

    // advance to next category after a tiny delay for smoothness
    if (categoryIndex < categories.length - 1) {
      setTimeout(() => setCurrentCategory(categoryIndex + 1), 200);
    }
  };

  // Adjust quantity (+/-) within the cart (step = baseAmount)
  const adjustCartQty = (catName, deltaSign) => {
    setCart(prev => {
      const row = prev[catName];
      if (!row) return prev;
      const cat = categories.find(c => c.name === catName);
      const step = cat.baseAmount;
      const nextQty = Math.max(step, (row.qty || step) + deltaSign * step);
      return { ...prev, [catName]: { ...row, qty: nextQty } };
    });
  };

  const removeFromCart = (catName) => {
    setCart(prev => {
      const { [catName]: _, ...rest } = prev;
      return rest;
    });
  };

  // Totals
  const totals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0, price = 0;

    for (const cat of categories) {
      const row = cart[cat.name];
      if (!row) continue;
      const { option, qty } = row;
      const factor = qty / cat.baseAmount;
      calories += option.calories * factor;
      protein += option.protein  * factor;
      carbs   += option.carbs    * factor;
      fat     += option.fat      * factor;
      price   += cat.pricePerBase * factor;
    }
    return {
      calories: Math.round(calories),
      protein:  Math.round(protein),
      carbs:    Math.round(carbs),
      fats:     Math.round(fat),
      price:    Math.round(price),
      items:    Object.keys(cart).length
    };
  }, [cart]);

  // Per-item helpers
  const itemMacros = (catName) => {
    const cat = categories.find(c => c.name === catName);
    const row = cart[catName];
    if (!row) return { cals:0,p:0,c:0,f:0,price:0,qty:0,unit:cat.unit };
    const factor = row.qty / cat.baseAmount;
    return {
      cals:  Math.round(row.option.calories * factor),
      p:     Math.round(row.option.protein  * factor),
      c:     Math.round(row.option.carbs    * factor),
      f:     Math.round(row.option.fat      * factor),
      price: Math.round(cat.pricePerBase * factor),
      qty:   row.qty,
      unit:  cat.unit
    };
  };

  return (
    <div className="pb-28">
      {/* Top category navigation */}
      <div className="p-4">
        <div className="flex justify-around mb-4">
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setCurrentCategory(i)}
              className={`px-3 py-1.5 text-sm rounded-2xl ${
                i === currentCategory ? "bg-black text-white" : "bg-neutral-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Instruction */}
        <h2 className="text-lg font-semibold text-center mb-3">
          {categories[currentCategory].title}
        </h2>

        {/* Options slider */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {categories[currentCategory].options.map((opt) => {
            const cat = categories[currentCategory];
            const isSelected = cart[cat.name]?.option?.id === opt.id;
            const row = cart[cat.name];
            return (
              <div
                key={opt.id}
                className={`min-w-[160px] bg-white rounded-xl border shadow-sm p-3 cursor-pointer active:scale-[0.99] transition ${
                  isSelected ? "border-black ring-1 ring-black" : "border-neutral-200"
                }`}
                onClick={() => handleOptionTap(currentCategory, opt)}
              >
                <img
                  src={opt.image}
                  alt={opt.name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h3 className="font-medium text-center truncate">{opt.name}</h3>
                <p className="text-xs text-neutral-600 text-center">
                  per {cat.baseAmount}{cat.unit}: {opt.calories} cal • {opt.protein}g P
                </p>

                {isSelected && (
                  <div className="mt-2 text-center text-xs text-neutral-700">
                    Selected: {row.qty}{cat.unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky black bar (₹ + View Cart) */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-screen-sm mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="w-full rounded-3xl bg-black text-white px-5 py-4 text-sm font-medium flex items-center justify-between shadow-lg">
            <span>₹ {totals.price}</span>
            <button
              onClick={() => { setShowCart(true); setCartView("items"); }}
              className="rounded-xl border border-white/20 px-3 py-1.5 active:scale-95"
            >
              View Cart
            </button>
          </div>
        </div>
      </div>

      {/* Quantity Drawer */}
      <AnimatePresence>
        {showQty && pendingPick && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowQty(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className="absolute bottom-0 left-0 right-0 max-w-screen-sm mx-auto bg-white rounded-t-3xl shadow-2xl"
              style={{ maxHeight: "80vh" }}
            >
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
                <h3 className="font-semibold">Choose Quantity</h3>
                <button
                  className="h-8 w-8 rounded-full grid place-items-center border"
                  onClick={() => setShowQty(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(80vh - 64px)" }}>
                {(() => {
                  const cat = categories[pendingPick.categoryIndex];
                  const unit = cat.unit;
                  const base = cat.baseAmount;

                  const quick = [base, base * 2, base * 3];

                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <img
                          src={pendingPick.option.image}
                          alt={pendingPick.option.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-medium">{pendingPick.option.name}</p>
                          <p className="text-xs text-neutral-600">
                            per {base}{unit}: {pendingPick.option.calories} cal • {pendingPick.option.protein}g P • {pendingPick.option.carbs}g C • {pendingPick.option.fat}g F
                          </p>
                        </div>
                      </div>

                      {/* Quick picks */}
                      <div className="flex gap-2">
                        {quick.map(q => (
                          <button
                            key={q}
                            onClick={() => setPendingQty(q)}
                            className={`px-3 py-2 rounded-2xl border text-sm ${
                              pendingQty === q ? "bg-black text-white border-black" : "bg-white border-neutral-300"
                            }`}
                          >
                            {q}{unit}
                          </button>
                        ))}
                      </div>

                      {/* Custom input */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Custom quantity ({unit})</label>
                        <input
                          type="number"
                          min={1}
                          step={unit === "g" ? 10 : 1}
                          value={pendingQty}
                          onChange={(e) => setPendingQty(Number(e.target.value))}
                          className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black outline-none"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          Tip: {unit === "g" ? `go in multiples of ${base}${unit} for easier adjustments` : "use whole numbers"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="p-4 border-t bg-neutral-50 sticky bottom-0 rounded-b-3xl">
                <button
                  onClick={confirmQuantity}
                  className="w-full py-3 bg-black text-white rounded-2xl font-medium active:scale-[0.98]"
                >
                  Add to Meal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer (items + checkout views) */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className="absolute bottom-0 left-0 right-0 max-w-screen-sm mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col"
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
                <h3 className="font-semibold">{cartView === "items" ? "Your Cart" : "Checkout"}</h3>
                <button
                  className="h-8 w-8 rounded-full grid place-items-center border"
                  onClick={() => setShowCart(false)}
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 64px - 148px)" }}>
                {cartView === "items" ? (
                  <div className="p-4 space-y-3">
                    {Object.keys(cart).length === 0 ? (
                      <p className="text-sm text-neutral-500">Your cart is empty.</p>
                    ) : (
                      categories.map(cat => {
                        const row = cart[cat.name];
                        if (!row) return null;
                        const macros = itemMacros(cat.name);
                        return (
                          <div key={cat.name} className="flex gap-3 items-center rounded-2xl border p-3">
                            <img src={row.option.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{row.option.name}</p>
                              <p className="text-xs text-neutral-500">
                                {macros.qty}{macros.unit} • {macros.cals} kcal • {macros.p}g P • {macros.c}g C • {macros.f}g F
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">₹ {macros.price}</p>
                            </div>

                            {/* Qty control (step = baseAmount) */}
                            <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-2 py-1">
                              <button
                                onClick={() => {
                                  // if trying to go below 1 step → remove item
                                  const step = cat.baseAmount;
                                  if ((row.qty - step) < step) return removeFromCart(cat.name);
                                  adjustCartQty(cat.name, -1);
                                }}
                                className="h-7 w-7 grid place-items-center rounded-lg border border-neutral-300 active:scale-95"
                                aria-label="Decrease"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-14 text-center text-sm font-medium">
                                {row.qty}{cat.unit}
                              </span>
                              <button
                                onClick={() => adjustCartQty(cat.name, 1)}
                                className="h-7 w-7 grid place-items-center rounded-lg border border-neutral-300 active:scale-95"
                                aria-label="Increase"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  // Checkout view
                  <div className="p-4 space-y-5 text-sm">
                    {/* Address selector */}
                    <div>
                      <label className="block font-medium text-neutral-700 mb-1">Delivery Address</label>
                      <select className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black outline-none">
                        <option>Home - 123 Street, City</option>
                        <option>Office - 456 Avenue, City</option>
                        <option>Add new address...</option>
                      </select>
                    </div>

                    {/* Coupon */}
                    <div>
                      <label className="block font-medium text-neutral-700 mb-1">Coupon Code</label>
                      <input
                        type="text"
                        placeholder="Enter coupon"
                        className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-black outline-none"
                      />
                    </div>

                    {/* Delivery */}
                    <div>
                      <p className="font-medium text-neutral-700 mb-1">Delivery</p>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="delivery" defaultChecked /> Pickup
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="delivery" /> Home Delivery
                        </label>
                      </div>
                    </div>

                    {/* Payment */}
                    <div>
                      <p className="font-medium text-neutral-700 mb-1">Payment</p>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="payment" defaultChecked /> UPI
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="payment" /> Card
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="payment" /> Cash on Delivery
                        </label>
                      </div>
                    </div>

                    {/* Price Summary */}
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
                  </div>
                )}
              </div>

              {/* Footer (nutrition + proceed / confirm) */}
              <div className="p-4 border-t bg-neutral-50 space-y-4 sticky bottom-0 rounded-b-3xl">
                {cartView === "items" ? (
                  <>
                    {/* Nutrition summary */}
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

                    {/* Total + Proceed */}
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-base font-semibold">Total • ₹ {totals.price}</p>
                      <button
                        disabled={totals.items === 0}
                        onClick={() => setCartView("checkout")}
                        className="px-4 py-3 rounded-2xl bg-black text-white text-sm font-medium active:scale-[0.99] disabled:opacity-50"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button className="w-full py-3 bg-black text-white rounded-2xl font-medium active:scale-[0.98]">
                      Confirm Order
                    </button>
                    <button
                      onClick={() => setCartView("items")}
                      className="w-full py-2 text-sm text-neutral-600"
                    >
                      ← Back to Cart
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* tiny style helper to hide horizontal scrollbar on sliders */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
