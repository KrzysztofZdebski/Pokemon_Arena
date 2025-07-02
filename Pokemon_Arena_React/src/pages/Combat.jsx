import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import socketService from "../utils/socketService";
import { Chat } from "../components/Chat";
import BattleUI from "../components/BattleUI";
import authApi from "../utils/authApi";
import PokemonCard from "../components/PokemonCard";
import AuthContext from "../utils/authProvider";

export default function Combat() {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);
    const [InBattle, setInBattle] = useState(false);
    const [pokemons, setPokemons] = useState([]);
    const [selectedPokemons, setSelectedPokemons] = useState([]);
    const [isReady, setIsReady] = useState(false);
    const [opponentUsername, setOpponentUsername] = useState("");
    const {username} = useContext(AuthContext);
    const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);



    // uniwersalna funkcja do ładowania pokemonów
    const fetchPokemons = async () => {
        try {
        const res = await authApi.get("/api/v1/pokemon/user");
        setPokemons(res.data);
        } catch (err) {
        console.error("Failed to fetch pokemons:", err);
        setPokemons([]);
        }
    };

    // automwayczne pobieranie pokemonów 
    useEffect(() => {
        fetchPokemons();
    }, []);

    useEffect(() => {
        if (!id) {
            console.error("Combat page requires a valid battle ID");
            return;
        }
        if (!socketService || !socketService.getConnectionStatus()) {
            console.error("Socket service is not connected");
            return;
        }
        socketService.updateCallbacks({
            onReceiveText: (data) => {
                console.log("Received text combat page:", data);
                setMessages(prevMessages => [...prevMessages, data.message]);
            },
            onBattleStart: (data) => {
                console.log("Battle started:", data);
                for (let i = 0; i < data.players.length; i++) {
                    if (data.players[i].username !== username) {
                        setOpponentUsername(data.players[i].username);
                        break;
                    }
                }
                setIsWaitingForOpponent(false);
                setInBattle(true);
            },
        });
    }, [id, messages]);

    useEffect(() => {
        console.log(selectedPokemons);
    }, [selectedPokemons]);

    const choosePokemon = (id) => {
        if (selectedPokemons.length >= 6) {
            alert("You can only choose 6 pokemons for the battle.");
            return;
        }
        if (selectedPokemons.includes(id)) {
            setSelectedPokemons(selectedPokemons.filter(pokemonId => pokemonId !== id));
            return;
        }
        setSelectedPokemons([...selectedPokemons, id]);
    }

    const ready = () => {
        let confirmed = confirm("Are you sure you want to start the battle?");
        if (!confirmed) {
            return;
        }
        if (isReady) {
            socketService.emit("not_ready", { battleId: id });
            setIsReady(false);
            setIsWaitingForOpponent(false); // przestań czekać
            return;
        }
        if (selectedPokemons.length < 1) {
            alert("You must select at least one pokemon to start the battle.");
            return;
        }
        socketService.emit("ready", { battleId: id, pokemons: selectedPokemons });
        setIsReady(true);
        setIsWaitingForOpponent(true); // zaczynamy czekać
    };



    return (
        <div className="min-h-screen mt-16 bg-gradient-to-br from-pokemon-red to-pokemon-yellow w-[99vw]">
        { InBattle ?
            <div className="flex flex-col lg:flex-row items-center justify-center w-full p-4 pt-20 mx-auto max-w-7xl min-h-[calc(100vh-4rem)]">
                <div className="w-full lg:w-3/5 h-[50vh] lg:h-[80vh]">
                    <BattleUI battleId={id} socket={socketService} className="w-full h-full" pokemons={selectedPokemons} opponent_username={opponentUsername}/>
                </div>
                <div className="w-full lg:w-2/5 h-[40vh] lg:h-[80vh] mt-4 lg:mt-0 lg:ml-4">
                    <Chat messages={messages} className="w-full h-full" socket={socketService} />
                </div>
            </div> :
            <>
            <div className="min-h-screen pt-10 bg-gradient-to-br from-pokemon-yellow to-pokemon-blue">
            <div className="container px-6 py-12 mx-auto max-w-7xl">
                <header className="mb-2 text-center">
                <h1 className="mb-4 text-5xl font-bold text-white">
                    Choose Six Pokemon
                </h1>
                </header>
                <main>
                <div className="flex justify-center mb-6">
                    <button
                    className="px-4 py-2 font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
                    onClick={fetchPokemons}
                    >
                    Refresh pokemon
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {pokemons.map((pokemon) => {
                    const now = Date.now();
                    const endTime = pokemon.training_end_time
                        ? Date.parse(pokemon.training_end_time.split(".")[0] + "Z")
                        : 0;
                    const isTraining = pokemon.is_training && endTime > now;
                    const secondsLeft = isTraining ? Math.floor((endTime - now) / 1000) : 0;

                    return (
                        <div className="w-full max-w-sm mx-auto">
                        <PokemonCard
                            key={pokemon.id}
                            pokemon={pokemon}
                            isTraining={isTraining}
                            secondsLeft={secondsLeft}
                            onChoose={choosePokemon}
                            disabled={false}
                            buttonType="battle"
                        />
                        </div>
                    );
                    })}
                </div>
                <div className="flex flex-col items-center mt-4">
                    {!isWaitingForOpponent &&
                        <button
                            className={`px-4 py-2 text-lg font-semibold text-white rounded-lg ${isReady ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                            onClick={ready}>
                            {isReady ? "Ready ✔" : "Not Ready ✕"}
                        </button>
                    }

                    {isWaitingForOpponent && (
                        <div className="flex flex-col items-center mt-4">
                            <div className="w-12 h-12 border-t-4 border-b-4 border-white rounded-full animate-spin"></div>
                            <p className="mt-2 font-semibold text-white">Looking for an opponent...</p>
                        </div>
                    )}
                </div>
                </main>
            </div>
            </div>
            </>
        }
        </div>
    );
}