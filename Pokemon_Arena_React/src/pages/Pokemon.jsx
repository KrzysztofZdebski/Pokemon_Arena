import React, { useState, useEffect } from "react";
import authApi from "../utils/authApi";
import PokemonCard from "../components/PokemonCard";

function Pokemon() {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pobierz pokemony użytkownika
  const fetchPokemons = async () => {
    setLoading(true);
    try {
      const res = await authApi.get("/api/v1/pokemon/user");
      const data = res.data;
      setPokemons(data);
      console.log("Pobrane pokemony:", data);
    } catch (err) {
      console.error("Błąd ładowania pokemonów:", err);
      setPokemons([]);
    } finally {
      setLoading(false);
    }
  };

  // automatyczne pobieranie przy załadowaniu
  useEffect(() => {
    fetchPokemons();

    // opcjonalny interwał do odliczania sekund w UI
    const interval = setInterval(() => {
      setPokemons((prev) => [...prev]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // trenowanie i wybór leveli
  const handleTrain = async (id) => {
    const levelsStr = prompt("Ile poziomów chcesz wytrenować dla tego pokemona?", "1");
    const levels = parseInt(levelsStr, 10);
    if (isNaN(levels) || levels < 1) return;

    // pobieranie kosztu
    let costInfo;
    try {
      costInfo = await authApi.post("/api/v1/pokemon/training_cost", {
        pokemon_id: id,
        duration_minutes: 10,
        levels,
      });
    } catch {
      alert("Nie udało się pobrać kosztu treningu!");
      return;
    }

    const confirmed = window.confirm(
      `Trening na ${levels} poziom(y) zajmie ${costInfo.data.total_minutes} minut i będzie kosztował ${costInfo.data.cost} monet. Kontynuować?`
    );
    if (!confirmed) return;

    // wysyłanie na trening
    try {
      await authApi.post("/api/v1/pokemon/train", {
        pokemon_id: id,
        duration_minutes: 10,
        levels,
      });
      fetchPokemons(); // odśwież pokemony po wysłaniu
    } catch (err) {
      alert(
        err.response?.data?.error ||
        "Nie udało się wysłać pokemona na trening."
      );
    }
  };

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
            {pokemons.map((pokemon) => {
              const now = Date.now();
              const endTime = pokemon.training_end_time
                ? Date.parse(pokemon.training_end_time.split(".")[0] + "Z")
                : 0;
              const isTraining = pokemon.is_training && endTime > now;
              const secondsLeft = isTraining ? Math.floor((endTime - now) / 1000) : 0;

              return (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  isTraining={isTraining}
                  secondsLeft={secondsLeft}
                  onTrain={handleTrain}
                  disabled={false}
                  buttonType="train"
                />
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Pokemon;


