import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  {
    name: "Protein",
    title: "Select a main protein",
    options: [
      { id: 1, name: "Chicken", calories: 200, protein: 30, carbs: 0, fat: 5, image: "https://source.unsplash.com/100x100/?chicken" },
      { id: 2, name: "Paneer", calories: 250, protein: 20, carbs: 10, fat: 15, image: "https://source.unsplash.com/100x100/?paneer" },
    ],
  },
  {
    name: "Toppings",
    title: "Select toppings",
    options: [
      { id: 3, name: "Carrots", calories: 50, protein: 1, carbs: 10, fat: 0, image: "https://source.unsplash.com/100x100/?carrot" },
      { id: 4, name: "Avocado", calories: 120, protein: 2, carbs: 8, fat: 10, image: "https://source.unsplash.com/100x100/?avocado" },
      { id: 5, name: "Chillies", calories: 30, protein: 1, carbs: 5, fat: 0, image: "https://source.unsplash.com/100x100/?chilli" },
    ],
  },
  {
    name: "Sauce",
    title: "Select a sauce",
    options: [
      { id: 6, name: "BBQ Sauce", calories: 80, protein: 1, carbs: 15, fat: 1, image: "https://source.unsplash.com/100x100/?bbq" },
      { id: 7, name: "Chilli Sauce", calories: 60, protein: 1, carbs: 12, fat: 0, image: "https://source.unsplash.com/100x100/?sauce" },
      { id: 8, name: "Salsa Sauce", calories: 50, protein: 2, carbs: 10, fat: 0, image: "https://source.unsplash.com/100x100/?salsa" },
    ],
  },
  {
    name: "Extras",
    title: "Select extras",
    options: [
      { id: 9, name: "Eggs", calories: 90, protein: 6, carbs: 1, fat: 7, image: "https://source.unsplash.com/100x100/?egg" },
      { id: 10, name: "Cheese", calories: 110, protein: 7, carbs: 1, fat: 9, image: "https://source.unsplash.com/100x100/?cheese" },
    ],
  },
];

export default function MyomMeal() {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [selectedItems, setSelectedItems] = useState({});
  const [quantities, setQuantities] = useState({});
  const [tab, setTab] = useState("summary");

  const handleSelect = (categoryIndex, option) => {
    setSelectedItems({
      ...selectedItems,
      [categories[categoryIndex].name]: option,
    });
    if (categoryIndex < categories.length - 1) {
      setTimeout(() => setCurrentCategory(categoryIndex + 1), 400);
    }
  };

  const handleQuantity = (id, change) => {
    setQuantities((prev) => {
      const newQty = (prev[id] || 0) + change;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const calculateTotals = () => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(selectedItems).forEach((item) => {
      const qty = quantities[item.id] || 1;
      totals.calories += item.calories * qty;
      totals.protein += item.protein * qty;
      totals.carbs += item.carbs * qty;
      totals.fat += item.fat * qty;
    });
    return totals;
  };

  return (
    <div className="p-4">
      {/* Top category navigation */}
      <div className="flex justify-around mb-4">
        {categories.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setCurrentCategory(i)}
            className={`px-2 py-1 text-sm rounded ${
              i === currentCategory ? "bg-red-500 text-white" : "bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Instruction text */}
      <h2 className="text-lg font-semibold text-center mb-3">
        {categories[currentCategory].title}
      </h2>

      {/* Options slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCategory}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        >
          {categories[currentCategory].options.map((opt) => (
            <div
              key={opt.id}
              className={`min-w-[150px] bg-white rounded-xl shadow-md p-3 cursor-pointer transition
                ${selectedItems[categories[currentCategory].name]?.id === opt.id ? "bg-red-100" : ""}`}
              onClick={() => handleSelect(currentCategory, opt)}
            >
              <img
                src={opt.image}
                alt={opt.name}
                className="w-full h-24 object-cover rounded-lg mb-2"
              />
              <h3 className="font-medium text-center">{opt.name}</h3>
              <p className="text-xs text-gray-600 text-center">
                {opt.calories} cal
              </p>
              {selectedItems[categories[currentCategory].name]?.id === opt.id && (
                <div className="flex justify-center mt-2">
                  <button
                    className="px-2 bg-gray-200 rounded-l"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantity(opt.id, -1);
                    }}
                  >
                    -
                  </button>
                  <span className="px-3 bg-white border">
                    {quantities[opt.id] || 1}
                  </span>
                  <button
                    className="px-2 bg-gray-200 rounded-r"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantity(opt.id, 1);
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Tabs */}
      <div className="mt-6">
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setTab("summary")}
            className={`px-4 py-2 rounded-lg ${
              tab === "summary" ? "bg-red-500 text-white" : "bg-gray-200"
            }`}
          >
            Meal Summary
          </button>
          <button
            onClick={() => setTab("nutrients")}
            className={`px-4 py-2 rounded-lg ${
              tab === "nutrients" ? "bg-red-500 text-white" : "bg-gray-200"
            }`}
          >
            Nutrients
          </button>
        </div>

        {tab === "summary" ? (
          <div>
            {categories.map((cat) => (
              <div key={cat.name} className="mb-3">
                <h4 className="font-semibold">{cat.name}</h4>
                {selectedItems[cat.name] ? (
                  <p>{selectedItems[cat.name].name} (x{quantities[selectedItems[cat.name].id] || 1})</p>
                ) : (
                  <p className="text-gray-500 text-sm">Not selected</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2">Item</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Calories</th>
                  <th className="border p-2">Protein</th>
                  <th className="border p-2">Carbs</th>
                  <th className="border p-2">Fat</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(selectedItems).map(([cat, item]) => {
                  const qty = quantities[item.id] || 1;
                  return (
                    <tr key={item.id}>
                      <td className="border p-2">{item.name}</td>
                      <td className="border p-2">{qty}</td>
                      <td className="border p-2">{item.calories * qty}</td>
                      <td className="border p-2">{item.protein * qty}</td>
                      <td className="border p-2">{item.carbs * qty}</td>
                      <td className="border p-2">{item.fat * qty}</td>
                    </tr>
                  );
                })}
                <tr className="font-semibold bg-gray-100">
                  <td className="border p-2">Total</td>
                  <td className="border p-2">-</td>
                  <td className="border p-2">{calculateTotals().calories}</td>
                  <td className="border p-2">{calculateTotals().protein}</td>
                  <td className="border p-2">{calculateTotals().carbs}</td>
                  <td className="border p-2">{calculateTotals().fat}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
