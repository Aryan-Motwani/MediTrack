import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import FoodMenu from "./components/FoodMenu.js";
import MyomMeal from "./components/MyomMeal.js";
import OrdersPage from "./components/Orders.js";

// Internal router for setPage-based navigation
function InternalPages({ page, setPage }) {
  switch (page) {
    case "menu":
      return <FoodMenu setPage={setPage} />;
    case "myom":
      return <MyomMeal setPage={setPage} />;
    default:
      return <Navigate to="/" replace />;
  }
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [page, setPage] = useState("menu");

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        <AnimatePresence>
          {showSplash && (
            <motion.div
              key="splash"
              className="flex items-center justify-center h-screen bg-white fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src="https://raw.githubusercontent.com/Aryan-Motwani/food/refs/heads/main/WhatsApp%20Image%20sdsd-modified.png"
                alt="Logo"
                className="w-80 h-80 object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!showSplash && (
          <Routes>
            {/* URL-based route for orders */}
            <Route path="/orders" element={<OrdersPage setPage={setPage} />} />
            
            {/* Catch-all route for internal state-based navigation */}
            <Route path="/*" element={<InternalPages page={page} setPage={setPage} />} />
          </Routes>
        )}
      </Router>
    </div>
  );
}

export default App;
