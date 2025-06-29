import React, { useState } from 'react';

export default function BattleUI({ battleId, className = "", socket }) {
  const [currentMenu, setCurrentMenu] = useState('main'); // 'main', 'fight', 'pokemon', 'bag'
  const [selectedMove, setSelectedMove] = useState(null);

  // Mock battle data - replace with real data from socket/props
  const [battleState, setBattleState] = useState({
    playerPokemon: {
      name: "SNORLAX",
      level: 32,
      hp: 125,
      maxHp: 150,
      status: "PAR",
      exp: 75,
    //   sprite: "/pokemon-sprites/snorlax-back.png"
    },
    opponentPokemon: {
      name: "MAGNEMITE",
      level: 26,
      hp: 80,
      maxHp: 95,
    //   sprite: "/pokemon-sprites/magnemite-front.png"
    },
    moves: [
      { name: "BODY SLAM", pp: 15, maxPp: 15, type: "Normal" },
      { name: "REST", pp: 10, maxPp: 10, type: "Psychic" },
      { name: "AMNESIA", pp: 20, maxPp: 20, type: "Psychic" },
      { name: "HYPER BEAM", pp: 5, maxPp: 5, type: "Normal" }
    ],
    messageText: "What will\nSNORLAX do?"
  });

  const getHpPercentage = (hp, maxHp) => (hp / maxHp) * 100;
  const getHpBarColor = (percentage) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleMenuAction = (action) => {
    setCurrentMenu(action);
  };

  const handleMoveSelect = (move) => {
    // Emit move selection to socket
    if (socket) {
      socket.emit('battle_move', { battleId, move: move.name });
    }
    setCurrentMenu('main');
  };

  return (
    <div className={`battle-ui w-full h-full relative ${className}`}>
      {/* Battle Field Background */}
      <div className="relative w-full overflow-hidden bg-gray-200 h-150">
        
        {/* Opponent Pokemon Area */}
        <div className="absolute top-4 left-4">
          {/* Opponent HP Bar */}
          <div className="p-2 mb-2 bg-gray-700 border-4 border-black rounded-lg" style={{ fontFamily: 'monospace' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">{battleState.opponentPokemon.name}</span>
              <span className="text-sm font-bold">Lv.{battleState.opponentPokemon.level}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-xs font-bold text-yellow-600">HP</span>
              <div className="w-24 h-2 bg-black border border-gray-600">
                <div 
                  className={`h-full transition-all duration-300 ${getHpBarColor(getHpPercentage(battleState.opponentPokemon.hp, battleState.opponentPokemon.maxHp))}`}
                  style={{ width: `${getHpPercentage(battleState.opponentPokemon.hp, battleState.opponentPokemon.maxHp)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Opponent Pokemon Sprite */}
        <div className="absolute top-16 right-20">
          <div className="flex items-center justify-center w-24 h-24 bg-gray-400 border-2 border-gray-600 rounded">
            <span className="text-xs">MAGNEMITE</span>
          </div>
          {/* Shadow */}
          <div className="w-16 h-4 mx-auto mt-2 bg-black rounded-full opacity-30"></div>
        </div>

        {/* Player Pokemon Area */}
        <div className="absolute bottom-32 right-4">
          {/* Player HP Bar */}
          <div className="p-2 mb-10 bg-gray-700 border-4 border-black rounded-lg" style={{ fontFamily: 'monospace' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">{battleState.playerPokemon.name}♂</span>
              <span className="text-sm font-bold">Lv.{battleState.playerPokemon.level}</span>
            </div>
            <div className="flex items-center mb-1">
              <span className="mr-2 text-xs font-bold text-yellow-600">HP</span>
              <div className="w-32 h-2 bg-black border border-gray-600">
                <div 
                  className={`h-full transition-all duration-300 ${getHpBarColor(getHpPercentage(battleState.playerPokemon.hp, battleState.playerPokemon.maxHp))}`}
                  style={{ width: `${getHpPercentage(battleState.playerPokemon.hp, battleState.playerPokemon.maxHp)}%` }}
                />
              </div>
              <span className="ml-2 text-xs">{battleState.playerPokemon.hp}/{battleState.playerPokemon.maxHp}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="px-1 mr-2 text-xs font-bold text-yellow-600 bg-yellow-200">{battleState.playerPokemon.status}</span>
              </div>
              <div className="text-xs">
                <div className="w-16 h-1 bg-black border border-gray-600">
                  <div className="h-full bg-blue-500" style={{ width: `${battleState.playerPokemon.exp}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Pokemon Sprite */}
        <div className="absolute bottom-48 left-16">
          <div className="flex items-center justify-center w-32 h-32 bg-gray-400 border-2 border-gray-600 rounded">
            <span className="text-sm">SNORLAX</span>
          </div>
          {/* Shadow */}
          <div className="w-20 h-6 mx-auto mt-2 bg-black rounded-full opacity-30"></div>
        </div>

        {/* Bottom UI Panel */}
        <div className="absolute bottom-0 left-0 right-0 flex h-40">
          
          {/* Message/Action Panel */}
          <div className="w-1/2 p-4 text-white bg-blue-900 border-4 border-yellow-600" style={{ fontFamily: 'monospace' }}>
            <div className="flex flex-col justify-center h-full">
              {currentMenu === 'main' && (
                <div className="text-lg leading-tight whitespace-pre-line">
                  {battleState.messageText}
                </div>
              )}
              {currentMenu === 'fight' && (
                <div className="grid h-full grid-cols-2 gap-2">
                  {battleState.moves.map((move, index) => (
                    <button
                      key={index}
                      onClick={() => handleMoveSelect(move)}
                      className="p-2 text-sm text-left bg-blue-800 border-2 border-white hover:bg-blue-700"
                    >
                      <div className="font-bold">{move.name}</div>
                      <div className="text-xs">PP {move.pp}/{move.maxPp}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Menu Panel */}
          <div className="w-1/2 bg-gray-300 border-4 border-black">
            {currentMenu === 'main' && (
              <div className="grid h-full grid-cols-2" style={{ fontFamily: 'monospace' }}>
                <button 
                  onClick={() => handleMenuAction('fight')}
                  className="flex items-center p-4 text-xl font-bold bg-gray-500 border-2 border-black hover:bg-gray-600"
                >
                  ▶FIGHT
                </button>
                <button 
                  onClick={() => handleMenuAction('bag')}
                  className="flex items-center p-4 text-xl font-bold bg-gray-500 border-2 border-black hover:bg-gray-600"
                >
                  BAG
                </button>
                <button 
                  onClick={() => handleMenuAction('pokemon')}
                  className="flex items-center p-4 text-xl font-bold bg-gray-500 border-2 border-black hover:bg-gray-600"
                >
                  POKéMON
                </button>
                <button 
                  onClick={() => handleMenuAction('run')}
                  className="flex items-center p-4 text-xl font-bold bg-gray-500 border-2 border-black hover:bg-gray-600"
                >
                  RUN
                </button>
              </div>
            )}
            {currentMenu !== 'main' && (
              <div className="flex items-center justify-center h-full">
                <button 
                  onClick={() => setCurrentMenu('main')}
                  className="p-2 text-lg font-bold bg-gray-200 border-2 border-black hover:bg-gray-100"
                >
                  ← BACK
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}