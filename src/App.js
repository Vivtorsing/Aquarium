import { useState } from "react";
import Aquarium from "./components/Aquarium";

function App() {
  const [showCorals, setShowCorals] = useState(true);

  return (
    <div className="font-sans">
      <Aquarium showCorals={showCorals} />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="text-white text-xl bg-pink-500/70 px-4 py-2 rounded-2xl shadow-lg">
          🐟 Welcome to the Aquarium!
        </div>
        <button
          onClick={() => setShowCorals((prev) => !prev)}
          className="text-white bg-pink-400/70 hover:bg-pink-500 px-3 py-1 rounded-lg shadow-md transition"
        >
          {showCorals ? "🌿 Hide Corals" : "🌿 Show Corals"}
        </button>
      </div>
    </div>
  );
}

export default App;