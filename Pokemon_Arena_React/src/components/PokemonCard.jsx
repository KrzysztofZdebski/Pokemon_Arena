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
          <span className="font-bold text-gray-500">
            Trenuje... {secondsLeft}s
          </span>
        </div>
      )}
      <div className="flex space-x-2">
        {buttonType === "train" ?
        <button
          className="flex-1 btn-primary"
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
        {showMoveForm ? (
          <div className="flex flex-col gap-2 w-full mt-2">
            <select
              className="p-2 border rounded"
              value={selectedReplace}
              onChange={(e) => setSelectedReplace(e.target.value)}
            >
              <option value="">Wybierz ruch do podmiany</option>
              {currentMoves.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>

            <select
              className="p-2 border rounded"
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
                className="btn-primary flex-1"
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
                className="btn-secondary flex-1"
                onClick={() => setShowMoveForm(false)}
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <button
            className="flex-1 btn-secondary"
            disabled={isTraining}
            onClick={async () => {
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
              }
            }}
          >
            Zmień ruch
          </button>
        )}
      </div>
    </div>
  );
}

export default PokemonCard;

