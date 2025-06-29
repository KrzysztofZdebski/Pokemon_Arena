import React from "react";

function getTypeString(pokemon) {
  // Jeśli masz pokemon.type (string), użyj go
  if (pokemon.type) return pokemon.type;
  // Jeśli masz tablicę types z PokeAPI, wyświetl wszystkie typy
  if (pokemon.types && Array.isArray(pokemon.types)) {
    return pokemon.types.map(t => t.type?.name).join("/");
  }
  return "";
}

function PokemonCard({
  pokemon,
  isTraining,
  secondsLeft,
  onTrain,
  disabled,
}) {
  return (
    <div
      className={`pokemon-card transition ${
        isTraining ? "bg-gray-300 grayscale pointer-events-none opacity-70" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{pokemon.name}</h3>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
          Lv. {pokemon.level}
        </span>
      </div>
      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-300">
          Type: {getTypeString(pokemon)}
        </p>
      </div>
      {isTraining && secondsLeft > 0 && (
        <div className="mb-4 text-center">
          <span className="text-gray-500 font-bold">
            Trenuje... {secondsLeft}s
          </span>
        </div>
      )}
      <div className="flex space-x-2">
        <button
          className="flex-1 btn-primary"
          onClick={() => onTrain(pokemon.id)}
          disabled={isTraining || disabled}
        >
          Trenuj
        </button>
        <button className="flex-1 btn-secondary" disabled={isTraining}>
          Details
        </button>
      </div>
    </div>
  );
}

export default PokemonCard;

