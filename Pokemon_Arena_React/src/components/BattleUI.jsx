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
    const [opponentPokemonCount, setOpponentPokemonCount] = useState({ total: 0, fainted: 0 });
    const [playerPokemonCount, setPlayerPokemonCount] = useState({ total: 0, fainted: 0 });
    const [playerStatusList, setPlayerStatusList] = useState([]);
    const [opponentStatusList, setOpponentStatusList] = useState([]);

    useEffect(() => {
        console.log("BattleUI mounted with battleId:", battleId);
        console.log(playerPokemon);
        if (!playerPokemon) {
            setCurrentMenu('pokemon');
            setShowBackButton(false);
        } else{
            setCurrentMenu('main');
            setShowBackButton(true);
        }
    }, [playerPokemon]);

    useEffect(() => {
        if(waitingForOpponent) {
            setCurrentMenu('waiting');
        } else if (currentMenu === 'waiting') {
            // When no longer waiting, return to appropriate menu
            if (battleStarted && playerPokemon) {
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

    const getStatusColor = (statusName) => {
        switch (statusName.toLowerCase()) {
            case 'burn':
                return 'bg-red-600';           // Fire/burning effect
            case 'poison':
                return 'bg-purple-600';        // Toxic/poison effect
            case 'paralysis':
                return 'bg-yellow-600';        // Electric/lightning effect
            case 'sleep':
                return 'bg-blue-600';          // Calm/drowsy effect
            case 'freeze':
                return 'bg-cyan-600';          // Ice/cold effect
            case 'confusion':
                return 'bg-pink-600';          // Psychic/mental effect
            case 'infatuation':
                return 'bg-rose-600';          // Love/charm effect
            case 'trap':
                return 'bg-gray-600';          // Trapped/bound effect
            case 'nightmare':
                return 'bg-black';             // Dark/scary effect
            case 'torment':
                return 'bg-orange-600';        // Frustration/anger effect
            case 'disable':
                return 'bg-slate-600';         // Disabled/blocked effect
            case 'yawn':
                return 'bg-indigo-600';        // Drowsy/sleepy effect
            case 'heal-block':
                return 'bg-red-800';           // Healing prevention
            case 'leech-seed':
                return 'bg-green-600';         // Nature/grass effect
            case 'embargo':
                return 'bg-amber-600';         // Restriction/limitation
            case 'perish-song':
                return 'bg-violet-900';        // Death/doom effect
            case 'ingrain':
                return 'bg-emerald-600';       // Rooted/nature effect
            case 'no-type-immunity':
                return 'bg-neutral-600';       // Neutral/nullified effect
            case 'unknown':
            case 'none':
            default:
                return 'bg-gray-500';          // Default/unknown effect
        }
    };

    const handleMenuAction = (action) => {
        setCurrentMenu(action);
    };

    const handleRun = () => {
        const confirmed = window.confirm("Are you sure you want to run?");
        if(confirmed){
            console.log("Emitting run event with:", {username, opponent_username});
            socket.emit('run', {username, opponent_username});
            navigate('/battle');
        }
    }

    // const handlePokemonSelect = (pokemon) => {
    //     if (socket) {
    //         setWaitingForOpponent(true);
    //         setMoves(pokemon.learned_moves);
    //         socket.emit('choose_pokemon', { battleId, pokemon_id: pokemon.id });
    //     }
    //     console.log("Selected Pokemon:", pokemon);
    // }

    const handleSwitchPokemon = (pokemon) => {
        if (socket) {
            let curr_id = playerPokemon ? playerPokemon.id : null;
            if (pokemon.id === curr_id) {
                console.log("Already selected this Pokemon:", pokemon);
                alert("You have already selected this Pokémon.");
                return;
            }
            setWaitingForOpponent(true);
            setMoves(pokemon.learned_moves);
            console.log({ action: {type: 'pokemon', pokemon_id: pokemon.id} })
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
            // if (!data || !data.pokemon) {
            //     console.error("Invalid Pokemon data received");
            //     return;
            // }
            // if (data.pokemon.player1.username === username){
            //     setPlayerPokemon(data.pokemon.player1.pokemon);
            //     setOpponentPokemon(data.pokemon.player2.pokemon);
            // } else{
            //     setPlayerPokemon(data.pokemon.player2.pokemon);
            //     setOpponentPokemon(data.pokemon.player1.pokemon);
            // }
            // setBattleStarted(true);
            // setWaitingForOpponent(false);
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
            setBattleStarted(true);
            console.log("Next round started:", data);
            if (!data || !data.game_state) {
                console.error("Invalid game state data received");
                return;
            }
            const opponentData = data.game_state.players.find(p => p.username !== username);
            const playerData = data.game_state.players.find(p => p.username === username);
            
            if(opponentData.pokemon){ {   
                setOpponentPokemon(opponentData.pokemon);
                setOpponentStatusList(opponentData.pokemon.status_list || []);
            }
            if(playerData.pokemon){
                setPlayerPokemon(playerData.pokemon);
                setMoves(playerData.pokemon.learned_moves);
                setPlayerStatusList(playerData.pokemon.status_list || []);
            }

            setOpponentPokemonCount({
                total: opponentData.pokemon_nbr,
                fainted: opponentData.fainted_nbr
            });}

            setPlayerPokemonCount({
                total: playerData.pokemon_nbr,
                fainted: playerData.fainted_nbr
            });
            
            setWaitingForOpponent(false);
        },
        onInvalidAction: (data) => {
            console.error("Invalid action:", data.message);
            alert(data.message);
            setWaitingForOpponent(false);
        },
        onPokemonFainted: (data) => {
            console.log("Pokemon fainted:", data);
            if (data.player === username) {
                if (data.pokemon_id === playerPokemon.id) {
                    playerPokemons.forEach((pokemon, index) => {
                        if (pokemon.id === data.pokemon_id) {
                            const updatedPokemons = [...playerPokemons];
                            updatedPokemons[index].fainted = true; // Mark as fainted
                            setPlayerPokemons(updatedPokemons);
                        }
                    });
                    setPlayerPokemon(null);
                }
            } else {
                if (data.pokemon_id === opponentPokemon.id) {
                    setOpponentPokemon(null);
                }
            }
        },
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
        <div className="relative w-full h-full overflow-hidden bg-gray-200 rounded-lg">
            
            {/* Opponent Pokemon Area */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
            {/* Opponent HP Bar */}
            <div className="w-48 h-16 p-1 mb-1 bg-gray-700 border-2 border-black rounded-lg sm:h-20 md:h-24 sm:p-2 sm:mb-2 sm:border-4 sm:w-56 md:w-60" style={{ fontFamily: 'monospace' }}>
                {opponentPokemon === null ? 
                <>
                <div className="text-xs font-bold text-gray-400 sm:text-sm">Waiting for opponent...</div>
                </> :
                <>
                <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold sm:text-sm">{opponentPokemon.name}</span>
                <span className="text-xs font-bold sm:text-sm">Lv.{opponentPokemon.level}</span>
                </div>
                <div className="flex items-center">
                <span className="mr-1 text-xs font-bold text-yellow-600 sm:mr-2">HP</span>
                <div className="w-28 sm:w-36 md:w-40 h-1.5 sm:h-2 bg-black border border-gray-600">
                    <div 
                    className={`h-full transition-all duration-300 ${getHpBarColor(getHpPercentage(opponentPokemon.current_HP, opponentPokemon.max_HP))}`}
                    style={{ width: `${getHpPercentage(opponentPokemon.current_HP, opponentPokemon.max_HP)}%` }}
                    />
                </div>
                </div>
                </>}
                {/* Opponent Status Effects */}
                {opponentPokemon && opponentStatusList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-1 ml-1 sm:mt-2 sm:mb-2 sm:ml-2">
                        {opponentStatusList.map((status, index) => (
                            <span
                                key={index}
                                className={`px-1 sm:px-2 py-0.5 sm:py-1 text-xs font-bold text-white rounded ${getStatusColor(status.name)}`}
                                title={`${status.name} - ${status.duration || 'Unknown'} turns left`}
                            >
                                {status.name.toUpperCase()}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Opponent Pokemon Status Icons */}
            {opponentPokemon && (
                <div className="flex gap-1 ml-1 sm:ml-2">
                    {Array.from({ length: opponentPokemonCount.total }, (_, index) => (
                        <img
                            key={index}
                            src="/pokeball-pokemon-svgrepo-com.svg"
                            alt={`Pokemon ${index + 1}`}
                            className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-opacity ${
                                index < (opponentPokemonCount.total - opponentPokemonCount.fainted)
                                    ? 'opacity-100' 
                                    : 'opacity-30 grayscale'
                            }`}
                            title={`Pokemon ${index + 1} - ${
                                index < (opponentPokemonCount.total - opponentPokemonCount.fainted) 
                                    ? index === 0 ? 'Active' : 'Healthy' 
                                    : 'Fainted'
                            }`}
                        />
                    ))}
                </div>
            )}
            </div>

            {/* Opponent Pokemon Sprite */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-10 md:right-10">
            {opponentPokemon ?
            <img 
                src={opponentPokemon.sprites.front_default} 
                className='object-contain w-40 h-auto sm:w-48 md:w-60 lg:w-72' 
                style={{ 
                    minWidth: '160px', 
                    minHeight: '160px',
                    imageRendering: 'pixelated' // Keeps pixel art crisp when scaled
                }}
            />
            : <></>}
            </div>

            {/* Player Pokemon Area */}
            <div className="absolute mb-6 bottom-32 sm:bottom-36 md:bottom-40 right-2 sm:right-4 sm:mb-8 md:mb-10">
            {/* Player HP Bar */}
            <div className="w-48 h-16 p-1 mb-1 bg-gray-700 border-2 border-black rounded-lg sm:h-20 md:h-24 sm:p-2 sm:mb-2 sm:border-4 sm:w-56 md:w-60" style={{ fontFamily: 'monospace' }}>
                {playerPokemon === null ? 
                <>
                <div className="text-xs font-bold text-gray-400 sm:text-sm">Select a Pokémon</div>
                </> :
                <>
                <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold sm:text-sm">{playerPokemon.name}</span>
                <span className="text-xs font-bold sm:text-sm">Lv.{playerPokemon.level}</span>
                </div>
                <div className="flex items-center">
                <span className="mr-1 text-xs font-bold text-yellow-600 sm:mr-2">HP</span>
                <div className="w-24 sm:w-32 md:w-40 h-1.5 sm:h-2 bg-black border border-gray-600">
                    <div 
                    className={`h-full transition-all duration-300 ${getHpBarColor(getHpPercentage(playerPokemon.current_HP, playerPokemon.max_HP))}`}
                    style={{ width: `${getHpPercentage(playerPokemon.current_HP, playerPokemon.max_HP)}%` }}
                    />
                </div>
                <span className="ml-1 text-xs sm:ml-2">{playerPokemon.current_HP}/{playerPokemon.max_HP}</span>
                </div>
                </>}
                {/* Player Status Effects */}
                {playerPokemon && playerStatusList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-1 ml-1 sm:mt-2 sm:mb-2 sm:ml-2">
                        {playerStatusList.map((status, index) => (
                            <span
                                key={index}
                                className={`px-1 sm:px-2 py-0.5 sm:py-1 text-xs font-bold text-white rounded ${getStatusColor(status.name)}`}
                                title={`${status.name} - ${status.duration || 'Unknown'} turns left`}
                            >
                                {status.name.toUpperCase()}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Player Pokemon Status Icons */}
            {playerPokemon && (
                <div className="flex gap-1 ml-1 sm:ml-2">
                    {Array.from({ length: playerPokemonCount.total }, (_, index) => (
                        <img
                            key={index}
                            src="/pokeball-pokemon-svgrepo-com.svg"
                            alt={`Pokemon ${index + 1}`}
                            className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-opacity ${
                                index < (playerPokemonCount.total - playerPokemonCount.fainted)
                                    ? 'opacity-100' 
                                    : 'opacity-30 grayscale'
                            }`}
                            title={`Pokemon ${index + 1} - ${
                                index < (playerPokemonCount.total - playerPokemonCount.fainted) 
                                    ? index === 0 ? 'Active' : 'Healthy' 
                                    : 'Fainted'
                            }`}
                        />
                    ))}
                </div>
            )}
            </div>

            {/* Player Pokemon Sprite */}
            <div className="absolute bottom-32 sm:bottom-36 md:bottom-40 left-4 sm:left-8 md:left-16">
            {playerPokemon ?
            <img 
                src={playerPokemon.sprites.back_default} 
                className='object-contain w-32 h-auto sm:w-48 md:w-60 lg:w-72' 
                style={{ 
                    minWidth: '160px', 
                    minHeight: '160px',
                    imageRendering: 'pixelated' // Keeps pixel art crisp when scaled
                }}
            />
            : <></>}
            </div>

            {/* Bottom UI Panel */}
            <div className="absolute bottom-0 left-0 right-0 flex h-32 sm:h-36 md:h-40">
            
            {/* Message/Action Panel */}
            <div className="w-1/2 p-2 text-white bg-blue-900 border-2 border-yellow-600 sm:p-3 md:p-4 sm:border-4" style={{ fontFamily: 'monospace' }}>
                <div className="flex flex-col justify-center h-full">
                {currentMenu === 'waiting' && (
                    <div className="text-sm font-bold text-center sm:text-lg">
                        Waiting for opponent...
                    </div>
                )}
                {currentMenu === 'main' && (
                    <div className="text-sm leading-tight whitespace-pre-line sm:text-lg">
                    What will {playerPokemon ? playerPokemon.name : "you"} do?
                    </div>
                )}
                {currentMenu === 'fight' && (
                    <div className="grid h-full grid-cols-2 grid-rows-2 gap-1 sm:gap-2">
                    {moves.map((move, index) => (
                        <button
                        key={index}
                        onClick={() => handleMoveSelect(move)}
                        className="p-0.5 text-left bg-blue-800 border-2 border-white sm:p-2 hover:bg-blue-700"
                        >
                        <div className="text-xs font-bold leading-tight sm:text-sm">{move.name}</div>
                        <div className="text-xs leading-tight sm:text-sm">PP {move.PP}/{move.maxPP}</div>
                        </button>
                    ))}
                    </div>
                )}
                {currentMenu === 'pokemon' && (
                    <div className="grid h-full grid-cols-2 grid-rows-3 gap-1 sm:gap-2">
                    {playerPokemons.map((pokemon, index) => (
                        <button
                        key={index}
                        onClick={() => handleSwitchPokemon(pokemon)}
                        className={`p-1 sm:p-2 text-xs sm:text-sm text-left border-white border-2 ${pokemon.fainted ? "bg-gray-500" : "bg-blue-800 hover:bg-blue-700"}`}
                        disabled={pokemon.fainted}
                        >
                        <div className="font-bold">{pokemon.name}</div>
                        </button>
                    ))}
                    </div>
                )}
                </div>
            </div>

            {/* Menu Panel */}
            <div className="w-1/2 bg-gray-500 border-2 border-black sm:border-4">
                {currentMenu === 'main' && (
                <div className="grid h-full grid-cols-2" style={{ fontFamily: 'monospace' }}>
                    <button 
                    onClick={() => handleMenuAction('fight')}
                    className="flex items-center p-2 text-sm font-bold bg-gray-500 border-2 border-black sm:p-3 md:p-4 sm:text-lg md:text-xl group hover:bg-gray-600 hover:cursor-pointer"
                    >
                        <span className="mr-1 transition-opacity opacity-0 sm:mr-2 group-hover:opacity-100">▶</span>
                        FIGHT
                    </button>
                    <button 
                    onClick={() => handleMenuAction('bag')}
                    className="flex items-center p-2 text-sm font-bold bg-gray-500 border-2 border-black sm:p-3 md:p-4 sm:text-lg md:text-xl group hover:bg-gray-600 hover:cursor-pointer"
                    >
                        <span className="mr-1 transition-opacity opacity-0 sm:mr-2 group-hover:opacity-100">▶</span>
                        BAG
                    </button>
                    <button 
                    onClick={() => handleMenuAction('pokemon')}
                    className="flex items-center p-2 text-sm font-bold bg-gray-500 border-2 border-black sm:p-3 md:p-4 sm:text-lg md:text-xl group hover:bg-gray-600 hover:cursor-pointer"
                    >
                        <span className="mr-1 transition-opacity opacity-0 sm:mr-2 group-hover:opacity-100">▶</span>
                        POKéMON
                    </button>
                    <button 
                    onClick={() => handleRun()}
                    className="flex items-center p-2 text-sm font-bold bg-gray-500 border-2 border-black sm:p-3 md:p-4 sm:text-lg md:text-xl group hover:bg-gray-600 hover:cursor-pointer"
                    >
                        <span className="mr-1 transition-opacity opacity-0 sm:mr-2 group-hover:opacity-100">▶</span>
                        RUN
                    </button>
                </div>
                )}
                {(currentMenu !== 'main' && currentMenu !== 'waiting') && (
                <div className="flex items-center justify-center h-full">
                    <button 
                    onClick={() => setCurrentMenu('main')}
                    className="p-1 text-sm font-bold bg-gray-500 border-2 border-black sm:p-2 sm:text-lg hover:bg-gray-600"
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