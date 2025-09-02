import { useState } from "react";
import FoodMenu from "./components/FoodMenu.js";
import MyomMeal from "./components/MyomMeal.js";

function App() {
  const [page, setPage] = useState("menu");

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="flex justify-around bg-white shadow p-4 sticky top-0 z-50">
        <button 
          onClick={() => setPage("menu")} 
          className={`px-4 py-2 rounded-lg ${page==="menu" ? "bg-red-500 text-white" : "bg-gray-200"}`}
        >
          Menu
        </button>
        <button 
          onClick={() => setPage("myom")} 
          className={`px-4 py-2 rounded-lg ${page==="myom" ? "bg-red-500 text-white" : "bg-gray-200"}`}
        >
          MyOM
        </button>
      </nav>

      {page === "menu" && <FoodMenu />}
      {page === "myom" && <MyomMeal />}
    </div>
  );
}

export default App;