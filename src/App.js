import Aquarium from "./components/Aquarium";

function App() {
  return (
    <div className="font-sans">
      <Aquarium />
      <div className="absolute top-4 left-4 text-white text-xl bg-pink-500/70 px-4 py-2 rounded-2xl shadow-lg">
        🐟 Welcome to the Aquarium!
      </div>
    </div>
  );
}

export default App;