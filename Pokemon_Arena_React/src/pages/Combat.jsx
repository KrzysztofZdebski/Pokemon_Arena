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
        <div className="w-screen min-h-screen mt-20 bg-gradient-to-br from-pokemon-red to-pokemon-yellow">
        { InBattle ?
            <div className="flex flex-row items-center justify-center h-full p-4 mx-auto w-7/10">
                <BattleUI battleId={id} socket={socketService} className="w-3/5" pokemons={selectedPokemons} opponent_username={opponentUsername}/>
                <Chat messages={messages} className="w-2/5 h-150" socket={socketService} />
            </div> :
            <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pokemons.map((pokemon) => (
                <PokemonCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    isTraining={pokemon.is_training}
                    disabled={pokemon.is_training}
                    buttonType="battle"
                    onChoose={choosePokemon}
                />
                ))}
            </div>
            <div className="flex flex-col items-center mt-4">
                <button
                    className={`px-4 py-2 text-lg font-semibold text-white rounded-lg ${isReady ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                    onClick={ready}>
                    {isReady ? "Ready ✔" : "Not Ready ✕"}
                </button>

                {isWaitingForOpponent && (
                    <div className="flex flex-col items-center mt-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
                        <p className="mt-2 text-white font-semibold">Looking for an opponent...</p>
                    </div>
                )}
            </div>
            </>
        }
        </div>
    );
}