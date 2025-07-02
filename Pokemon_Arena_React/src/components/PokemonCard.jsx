import React from 'react';
import authApi from '../utils/authApi';
import { useState } from 'react';

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
  buttonType,
  onChoose,
}) {
  const [chosen, setChosen] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [currentMoves, setCurrentMoves] = useState([]);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [selectedReplace, setSelectedReplace] = useState("");
  const [selectedNewMove, setSelectedNewMove] = useState("");
  const [isLoadingMoves, setIsLoadingMoves] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  return (
    <>
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 dark:text-gray-300">
            Type: {getTypeString(pokemon)}
          </p>
          <button
            className="px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={() => setShowStatsModal(true)}
            disabled={isTraining}
            title="View Pokemon Stats"
          >
            📊
          </button>
        </div>
        {isTraining && secondsLeft > 0 && (
          <div className="mb-4 text-center">
            <span className="font-bold text-gray-500">
              Trenuje... {secondsLeft}s
            </span>
          </div>
        )}
        <div className="flex space-x-2">
          {buttonType === "train" ?
          <button
            className="flex-1 px-4 py-2 font-bold text-black bg-yellow-400 rounded hover:bg-yellow-500"
            onClick={() => onTrain(pokemon.id)}
            disabled={isTraining || disabled}
          >
            Trenuj
          </button> :
          <button
            className="flex-1 btn-primary"
            onClick={() => {
              setChosen(!chosen);
              onChoose(pokemon.id);
            }}
            disabled={isTraining || disabled}
          >
            {chosen ? "Abandon" : "Choose"}
          </button>}
          
          {!showMoveForm && !isLoadingMoves && (
            <button
              className="flex-1 btn-secondary"
              disabled={isTraining}
              onClick={async () => {
                setIsLoadingMoves(true);
                try {
                  const res = await authApi.get(`/api/v1/pokemon/${pokemon.id}`);
                  const pokeDetails = res.data;

                  const resMoves = await authApi.get(`/api/v1/pokemon/status?pokemon_id=${pokemon.id}`);
                  const availableData = resMoves.data;

                  const current = Array.isArray(pokeDetails.moves)
                    ? pokeDetails.moves.map((m) => typeof m === "string" ? m : m.name)
                    : [];
                  const available = availableData.available_moves || [];

                  setCurrentMoves(current);
                  setAvailableMoves(available);
                  setSelectedReplace("");
                  setSelectedNewMove("");
                  setShowMoveForm(true);
                } catch (e) {
                  alert("Błąd przy ładowaniu ruchów.");
                  console.error(e);
                } finally {
                  setIsLoadingMoves(false);
                }
              }}
            >
              Zmień ruch
            </button>
          )}
        </div>
        
        {isLoadingMoves && (
          <div className="flex flex-col items-center mt-4">
            <div className="w-8 h-8 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
            <p className="mt-2 text-sm font-semibold text-white">Loading moves...</p>
          </div>
        )}

        {showMoveForm && (
          <div className="flex flex-col w-full gap-2 mt-4">
            <select
              className="w-full p-2 text-black bg-white border rounded"
              value={selectedReplace}
              onChange={(e) => setSelectedReplace(e.target.value)}
            >
              <option value="">Wybierz ruch do podmiany</option>
              {currentMoves.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>

            <select
              className="w-full p-2 text-black bg-white border rounded"
              value={selectedNewMove}
              onChange={(e) => setSelectedNewMove(e.target.value)}
            >
              <option value="">Wybierz nowy ruch</option>
              {availableMoves.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>

            <div className="flex space-x-2">
              <button
                className="flex-1 btn-primary"
                onClick={async () => {
                  if (!selectedReplace || !selectedNewMove) {
                    alert("Wybierz oba ruchy.");
                    return;
                  }
                  try {
                    await authApi.post("/api/v1/pokemon/change_move", {
                      pokemon_id: pokemon.id,
                      move_to_replace: selectedReplace,
                      new_move: selectedNewMove,
                    });
                    alert("Ruch został zmieniony!");
                    setShowMoveForm(false);
                  } catch (e) {
                    const msg = e.response?.data?.error || "Błąd przy zmianie ruchu.";
                    alert(msg);
                  }
                }}
              >
                Zatwierdź
              </button>
              <button
                className="flex-1 btn-secondary"
                onClick={() => setShowMoveForm(false)}
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-opacity-30">
          <div className="pokemon-card rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-300">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {pokemon.name} Stats
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                onClick={() => setShowStatsModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              {pokemon.stats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Level:</span>
                    <span className="text-gray-600 dark:text-gray-400">{pokemon.level || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">HP:</span>
                    <span className="text-gray-600 dark:text-gray-400">{pokemon.stats[0].base_stat || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Attack:</span>
                    <span className="text-gray-600 dark:text-gray-400">{pokemon.stats[1].base_stat || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Defense:</span>
                    <span className="text-gray-600 dark:text-gray-400">{pokemon.stats[2].base_stat || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Special Attack:</span>
                    <span className="text-gray-600 dark:text-gray-400">{pokemon.stats[3].base_stat || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Special Defense:</span>
                    <span className="text-gray-600 dark:text-gray-400">{pokemon.stats[4].base_stat || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Speed:</span>
                    <span className="text-gray-600 dark:text-gray-400">{pokemon.stats[5].base_stat || 0}</span>
                  </div>
                  

                  {pokemon.moves && pokemon.moves.length > 0 && (
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-700 dark:text-gray-300">Moves:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {pokemon.moves.map((move, index) => (
                          <div key={index} className="px-2 py-1 text-sm text-gray-800 bg-gray-200 rounded dark:bg-gray-600 dark:text-gray-200">
                            {move.name || "Unknown Move"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-600 dark:text-gray-400">No stats available</p>
              )}
            </div>
            
            <div className="flex justify-end p-4 border-t border-gray-300 dark:border-gray-600">
              <button
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                onClick={() => setShowStatsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PokemonCard;

