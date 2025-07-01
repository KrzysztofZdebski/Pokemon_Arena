import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../utils/authProvider';
import authApi from '../utils/authApi';

export default function BattleUI({ battleId, className = "", socket, pokemons, opponent_username }) {
    const [currentMenu, setCurrentMenu] = useState('pokemon'); // 'main', 'fight', 'pokemon', 'bag', 'waiting'
    const navigate = useNavigate();
    const [playerPokemons, setPlayerPokemons] = useState([]);
    const [playerPokemon, setPlayerPokemon] = useState(null);
    const [opponentPokemon, setOpponentPokemon] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const {username} = useContext(AuthContext);
    const [battleStarted, setBattleStarted] = useState(false);
    const [waitingForOpponent, setWaitingForOpponent] = useState(false);
    const [showBackButton, setShowBackButton] = useState(false);
    const [moves, setMoves] = useState([]);

    useEffect(() => {
        if (!battleStarted) {
            setCurrentMenu('pokemon');
            setShowBackButton(false);
        } else{
            setCurrentMenu('main');
            setShowBackButton(true);
        }
    }, [battleStarted]);

    useEffect(() => {
        if(waitingForOpponent) {
            setCurrentMenu('waiting');
        } else if (currentMenu === 'waiting') {
            // When no longer waiting, return to appropriate menu
            if (battleStarted) {
                setCurrentMenu('main');
            } else {
                setCurrentMenu('pokemon');
            }
        }
    }, [waitingForOpponent, currentMenu, battleStarted]);

    useEffect(() => {
        console.log("Player Pokemons:", playerPokemons);
        console.log("Player Pokemon:", playerPokemon);
        console.log("Opponent Pokemon:", opponentPokemon);
    }, [playerPokemons, opponentPokemon, playerPokemon]);

    const getHpPercentage = (hp, maxHp) => (hp / maxHp) * 100;
    const getHpBarColor = (percentage) => {
        if (percentage > 50) return 'bg-green-500';
        if (percentage > 20) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const handleMenuAction = (action) => {
        setCurrentMenu(action);
    };

    // const handleMoveSelect = (move) => {
    //     // Emit move selection to socket
    //     if (socket) {
    //     socket.emit('battle_move', { battleId, move: move.name });
    //     }
    //     setCurrentMenu('main');
    // };

    const handleRun = () => {
        const confirmed = window.confirm("Are you sure you want to run?");
        if(confirmed){
            console.log("Emitting run event with:", {username, opponent_username});
            socket.emit('run', {username, opponent_username});
            navigate('/battle');
        }
    }

    const handlePokemonSelect = (pokemon) => {
        if (socket) {
            setWaitingForOpponent(true);
            setMoves(pokemon.learned_moves);
            socket.emit('choose_pokemon', { battleId, pokemon_id: pokemon.id });
        }
        console.log("Selected Pokemon:", pokemon);
    }

    const handleSwitchPokemon = (pokemon) => {
        if (socket) {
            if (pokemon.id === playerPokemon.id) {
                console.log("Already selected this Pokemon:", pokemon);
                alert("You have already selected this Pokémon.");
                return;
            }
            setWaitingForOpponent(true);
            setMoves(pokemon.learned_moves);
            socket.emit('next_action', { action: {type: 'pokemon', pokemon_id: pokemon.id} });
        }
    }

    const handleMoveSelect = (move) => {
        if (socket) {
            if (!playerPokemon || !move) {
                console.error("Player Pokemon or move is not selected");
                return;
            }
            if (move.PP <= 0) {
                alert("This move has no PP left.");
                return;
            }
            setWaitingForOpponent(true);
            socket.emit('next_action', { action: { type: 'move', move: move.name } });
        }
        console.log("Selected Move:", move);
    }

    useEffect(() => {
        const fetchPokemons = async () => {
            try {
                setIsLoading(true);
                const pokemonPromises = [];
                for (let i = 0; i < pokemons.length; i++) {
                    const poke_id = pokemons[i];
                    pokemonPromises.push(authApi.get(`/api/v1/battles/pokemon`, 
                        { params: { pokemon_id: poke_id } }
                    ));
                }
                const pokemonResponses = await Promise.all(pokemonPromises);
                console.log("Pokemon Responses:", pokemonResponses);
                const pokemonList = pokemonResponses.map(response => response.data.data);
                setPlayerPokemons(pokemonList);
            } catch (error) {
                console.error("Error fetching Pokemon:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (pokemons && pokemons.length > 0) {
            fetchPokemons();
        } else {
            setIsLoading(false);
        }
    }, [pokemons]);

    socket.updateCallbacks({
        // onSelectedPokemon: (data) => {
        //     console.log("Selected Pokemon:", data);
        //     if (!data || !data.pokemon) {
        //         console.error("Invalid Pokemon data received");
        //         return;
        //     }
        //     if (data.player !== username) {
        //         setOpponentPokemon(data.pokemon);
        //         return;
        //     }
        //     setPlayerPokemon(data.pokemon);
        // },
        onPokemonPrepared: (data) => {
            console.log("Battle started:", data);
            if (!data || !data.pokemon) {
                console.error("Invalid Pokemon data received");
                return;
            }
            if (data.pokemon.player1.username === username){
                setPlayerPokemon(data.pokemon.player1.pokemon);
                setOpponentPokemon(data.pokemon.player2.pokemon);
            } else{
                setPlayerPokemon(data.pokemon.player2.pokemon);
                setOpponentPokemon(data.pokemon.player1.pokemon);
            }
            setBattleStarted(true);
            setWaitingForOpponent(false);
        },
        onBattleEnd: (data) => {
            console.log("Battle ended:", data);
            if (data.winner === username) {
                alert("You won the battle!");
            } else {
                alert("You lost the battle.");
            }
            socket.disconnect();
            navigate('/battle');
        },
        onNextRound: (data) => {
            console.log("Next round started:", data);
            if (!data || !data.game_state) {
                console.error("Invalid game state data received");
                return;
            }
            setOpponentPokemon(data.game_state.players.find(p => p.username !== username).pokemon);
            setPlayerPokemon(data.game_state.players.find(p => p.username === username).pokemon);
            setMoves(data.game_state.players.find(p => p.username === username).pokemon.learned_moves);
            setWaitingForOpponent(false);
        },
        onInvalidAction: (data) => {
            console.error("Invalid action:", data.message);
            alert(data.message);
            setWaitingForOpponent(false);
        }
    })

    // Show loading state while fetching Pokemon data
    if (isLoading) {
        return (
            <div className={`battle-ui w-full h-full relative ${className} flex items-center justify-center`}>
                <div className="text-xl font-bold">Loading Pokemon...</div>
            </div>
        );
    }

    return (
        <div className={`battle-ui w-full h-full relative ${className}`}>
        {/* Battle Field Background */}
        <div className="relative w-full overflow-hidden bg-gray-200 h-150">
            
            {/* Opponent Pokemon Area */}
            <div className="absolute top-4 left-4">
            {/* Opponent HP Bar */}
            <div className="h-20 p-2 mb-2 bg-gray-700 border-4 border-black rounded-lg w-60" style={{ fontFamily: 'monospace' }}>
                {opponentPokemon === null ? 
                <>
                <div className="text-sm font-bold text-gray-400">Waiting for opponent...</div>
                </> :
                <>
                <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">{opponentPokemon.name}</span>
                <span className="text-sm font-bold">Lv.{opponentPokemon.level}</span>
                </div>
                <div className="flex items-center">
                <span className="mr-2 text-xs font-bold text-yellow-600">HP</span>
                <div className="w-40 h-2 bg-black border border-gray-600">
                    <div 
                    className={`h-full transition-all duration-300 ${getHpBarColor(getHpPercentage(opponentPokemon.current_HP, opponentPokemon.max_HP))}`}
                    style={{ width: `${getHpPercentage(opponentPokemon.current_HP, opponentPokemon.max_HP)}%` }}
                    />
                </div>
                </div>
                </>}
            </div>
            
            {/* Opponent Pokemon Status Icons */}
            {/* {opponentPokemon && (
                <div className="flex gap-1 ml-2">
                    {Array.from({ length: playerPokemons.length }, (_, index) => (
                        <div
                            key={index}
                            className={`w-6 h-6 border-2 rounded-full ${
                                index === 0 ? 'bg-green-400 border-green-600' : 'bg-gray-400 border-gray-600'
                            }`}
                            title={`Pokemon ${index + 1}`}
                        />
                    ))}
                </div>
            )} */}
            </div>

            {/* Opponent Pokemon Sprite */}
            <div className="absolute top-10 right-10">
            {battleStarted ?
            <img src={opponentPokemon.sprites.front_default} className='w-60' />
            : <></>}
            </div>

            {/* Player Pokemon Area */}
            <div className="absolute bottom-32 right-4">
            {/* Player HP Bar */}
            <div className="h-20 p-2 mb-1 bg-gray-700 border-4 border-black rounded-lg w-60" style={{ fontFamily: 'monospace' }}>
                {playerPokemon === null ? 
                <>
                <div className="text-sm font-bold text-gray-400">Select a Pokémon</div>
                </> :
                <>
                <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">{playerPokemon.name}</span>
                <span className="text-sm font-bold">Lv.{playerPokemon.level}</span>
                </div>
                <div className="flex items-center mb-1">
                <span className="mr-2 text-xs font-bold text-yellow-600">HP</span>
                <div className="w-40 h-2 bg-black border border-gray-600">
                    <div 
                    className={`h-full transition-all duration-300 ${getHpBarColor(getHpPercentage(playerPokemon.current_HP, playerPokemon.max_HP))}`}
                    style={{ width: `${getHpPercentage(playerPokemon.current_HP, playerPokemon.max_HP)}%` }}
                    />
                </div>
                <span className="ml-2 text-xs">{playerPokemon.current_HP}/{playerPokemon.max_HP}</span>
                </div>
                <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span className="px-1 mr-2 text-xs font-bold text-yellow-600 bg-yellow-200">{playerPokemon.status}</span>
                </div>
                </div>
                </>}
            </div>
            
            {/* Player Pokemon Status Icons */}
            {playerPokemon && (
                <div className="flex justify-end gap-1 mb-10 mr-2">
                    {playerPokemons.map((pokemon, index) => (
                        <div
                            key={index}
                            className={`w-6 h-6 border-2 rounded-full ${
                                pokemon.current_HP > 0 
                                    ? pokemon.id === playerPokemon.id 
                                        ? 'bg-green-400 border-green-600' 
                                        : 'bg-blue-400 border-blue-600'
                                    : 'bg-red-400 border-red-600'
                            }`}
                            title={`${pokemon.name} - ${pokemon.current_HP > 0 ? 'Healthy' : 'Fainted'}`}
                        />
                    ))}
                </div>
            )}
            </div>

            {/* Player Pokemon Sprite */}
            <div className="absolute bottom-32 left-16">
            {battleStarted ?
            <img src={playerPokemon.sprites.back_default} className='w-60' />
            : <></>}
            </div>

            {/* Bottom UI Panel */}
            <div className="absolute bottom-0 left-0 right-0 flex h-40">
            
            {/* Message/Action Panel */}
            <div className="w-1/2 p-4 text-white bg-blue-900 border-4 border-yellow-600" style={{ fontFamily: 'monospace' }}>
                <div className="flex flex-col justify-center h-full">
                {currentMenu === 'waiting' && (
                    <div className="text-lg font-bold text-center">
                        Waiting for opponent...
                    </div>
                )}
                {currentMenu === 'main' && (
                    <div className="text-lg leading-tight whitespace-pre-line">
                    What will {playerPokemon.name} do?
                    </div>
                )}
                {currentMenu === 'fight' && (
                    <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
                    {moves.map((move, index) => (
                        <button
                        key={index}
                        onClick={() => handleMoveSelect(move)}
                        className="p-2 text-sm text-left bg-blue-800 border-2 border-white hover:bg-blue-700"
                        >
                        <div className="font-bold">{move.name}</div>
                        <div className="text-xs">PP {move.PP}/{move.maxPP}</div>
                        </button>
                    ))}
                    </div>
                )}
                {currentMenu === 'pokemon' && (
                    <div className="grid h-full grid-cols-2 grid-rows-3 gap-2">
                    {playerPokemons.map((pokemon, index) => (
                        <button
                        key={index}
                        onClick={playerPokemon ? () => handleSwitchPokemon(pokemon) : () => handlePokemonSelect(pokemon)}
                        className="p-2 text-sm text-left bg-blue-800 border-2 border-white hover:bg-blue-700"
                        >
                        <div className="font-bold">{pokemon.name}</div>
                        </button>
                    ))}
                    </div>
                )}
                </div>
            </div>

            {/* Menu Panel */}
            <div className="w-1/2 bg-gray-500 border-4 border-black">
                {currentMenu === 'main' && (
                <div className="grid h-full grid-cols-2" style={{ fontFamily: 'monospace' }}>
                    <button 
                    onClick={() => handleMenuAction('fight')}
                    className="flex items-center p-4 text-xl font-bold bg-gray-500 border-2 border-black group hover:bg-gray-600 hover:cursor-pointer"
                    >
                        <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                        FIGHT
                    </button>
                    <button 
                    onClick={() => handleMenuAction('bag')}
                    className="flex items-center p-4 text-xl font-bold bg-gray-500 border-2 border-black group hover:bg-gray-600 hover:cursor-pointer"
                    >
                        <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                        BAG
                    </button>
                    <button 
                    onClick={() => handleMenuAction('pokemon')}
                    className="flex items-center p-4 text-xl font-bold bg-gray-500 border-2 border-black group hover:bg-gray-600 hover:cursor-pointer"
                    >
                        <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                        POKéMON
                    </button>
                    <button 
                    onClick={() => handleRun()}
                    className="flex items-center p-4 text-xl font-bold bg-gray-500 border-2 border-black group hover:bg-gray-600 hover:cursor-pointer"
                    >
                        <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                        RUN
                    </button>
                </div>
                )}
                {(currentMenu !== 'main' && currentMenu !== 'waiting') && (
                <div className="flex items-center justify-center h-full">
                    <button 
                    onClick={() => setCurrentMenu('main')}
                    className="p-2 text-lg font-bold bg-gray-500 border-2 border-black hover:bg-gray-600"
                    hidden={!showBackButton}
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