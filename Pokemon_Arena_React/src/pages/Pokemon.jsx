import React, { useState, useEffect } from "react";
import authApi from "../utils/authApi";
import PokemonCard from "../components/PokemonCard";

function Pokemon() {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainingStatus, setTrainingStatus] = useState({});

  // uniwersalna funkcja do ładowania pokemonów
  const fetchPokemons = async () => {
    setLoading(true);
    try {
      const res = await authApi.get("/api/v1/pokemon/user");
      setPokemons(res.data);
    } catch (err) {
      setPokemons([]);
    } finally {
      setLoading(false);
    }
  };

  // automwayczne pobieranie pokemonów 
  useEffect(() => {
    fetchPokemons();
  }, []);

  // trenowanie i wybór leveli
const handleTrain = async (id) => {
  const levelsStr = prompt("Ile poziomów chcesz wytrenować dla tego pokemona?", "1");
  const levels = parseInt(levelsStr, 10);
  if (isNaN(levels) || levels < 1) return;

  // pobieranie kosztu treningu
  let costInfo;
  try {
    costInfo = await authApi.post("/api/v1/pokemon/training_cost", {
      pokemon_id: id,
      duration_minutes: 10,
      levels
    });
  } catch {
    alert("Nie udało się pobrać kosztu treningu!");
    return;
  }

  const confirmed = window.confirm(
    `Trening na ${levels} poziom(y) zajmie ${costInfo.data.total_minutes} minut i będzie kosztował ${costInfo.data.cost} monet. Kontynuować?`
  );
  if (!confirmed) return;

  // wysyłanie pokemona na trening
  try {
    const response = await authApi.post("/api/v1/pokemon/train", {
      pokemon_id: id,
      duration_minutes: 10,
      levels,
    });
    const { end_time } = response.data;
    setTrainingStatus((prev) => ({
      ...prev,
      [id]: new Date(end_time).getTime(),
    }));
  } catch (err) {
    alert(
      err.response?.data?.error ||
        "Nie udało się wysłać pokemona na trening."
    );
  }
};


  const isTraining = (id) =>
    trainingStatus[id] && trainingStatus[id] > Date.now();
  const getSecondsLeft = (id) =>
    !isTraining(id)
      ? 0
      : Math.max(0, Math.floor((trainingStatus[id] - Date.now()) / 1000));

  if (loading) {
    return (
      <div className="flex justify-center w-full">
        <p className="text-white font-[PokemonFont] text-lg">
          Ładowanie kolekcji...
        </p>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-pokemon-yellow to-pokemon-blue">
      <div className="container px-6 py-12 mx-auto">
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold text-white">
            Pokemon Collection
          </h1>
          <p className="text-xl text-white/80">Manage your Pokemon team!</p>
        </header>
        <main>
          <div className="flex justify-center mb-6">
            <button
              className="px-4 py-2 rounded-lg btn-primary"
              onClick={fetchPokemons}
            >
              Odśwież pokemony
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pokemons.map((pokemon) => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                isTraining={isTraining(pokemon.id)}
                secondsLeft={getSecondsLeft(pokemon.id)}
                onTrain={handleTrain}
                disabled={false}
                buttonType="train"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Pokemon;

