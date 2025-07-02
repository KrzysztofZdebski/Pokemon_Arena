import React, { useState } from "react";
import Button from "../components/Button";
import authApi from "../utils/authApi";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";

function Pokeballs() {
    const [pokemon, setPokemon] = useState(null);
    const [loading, setLoading] = useState(false);
    const buyPokeBall = async () =>{
        try{
            const res = await authApi.get('api/v1/pokeballs/');
            const poke = res.data.pokemon;
            // setPokemon(res.pokemon)
            setPokemon(poke);
        }catch(err){
            setPokemon(null);
            alert("Error fetching Pokémon data. Please try again later.");
            console.error("Error fetching Pokémon data:", err);
        }
        setLoading(false);
    }
    const buyGreatBall = async () => {
        setLoading(true);
        try{
            const res = await authApi.get('api/v1/pokeballs/greatball');
            const poke = res.data.pokemon;
            setLoading(false);
            //setPokemon(res.pokemon)
            // alert(`You caught a ${res.data.name}`);
            setPokemon(poke);
        }catch(err){
            setPokemon(null);
            alert("Error fetching Pokémon data. Please try again later.");
            setLoading(false);
            console.error("Error fetching Pokémon data:", err);
        }
    }
    

  return (
        <div className="sm:w-[100vw] md:w-[99vw] lg:w-[99wv] mt-26" style={{ padding: 25 }}>
        <div className="mx-auto max-w-7xl">
            {loading && (
                <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                    <div>Loading Pokemon</div>
                </div>
            )}
            {!loading && pokemon && (
            <div className="flex items-center justify-center w-full min-h-screen bg-gradient-to-br from-pokemon-red to-pokemon-yellow">
                <div className="relative flex flex-col items-center w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <button
                        onClick={() => setPokemon(null)}
                        style={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            background: "#eee",
                            border: "none",
                            borderRadius: "50%",
                            width: 32,
                            height: 32,
                            cursor: "pointer",
                            fontWeight: "bold",
                            color: "black",
                            fontSize: 20,
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <img
                        src={pokemon.sprites.front_default}
                        alt={pokemon.name}
                        style={{ width: 140, height: 140, marginTop: 16 }}
                    />
                    <h2 className="mt-4 text-2xl font-bold text-black capitalize">{pokemon.name}</h2>
                    <div className="w-full px-2 mt-6">
                        <ul className="text-left text-black">
                            <table>
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2">Stat</th>
                                        <th className="px-4 py-2">Value</th>
                                        <th className="px-4 py-2">🔥</th>
                                        
                                    </tr>
                                </thead>
                                <tbody>
                                    {pokemon.stats.map((stat) => (
                                        <tr key={stat.stat.name}>
                                            <td className="px-4 py-2 capitalize">{stat.stat.name}</td>
                                            <td className="px-4 py-2">{stat.base_stat}</td>
                                        </tr>
                                    ))}
                                  
                                </tbody>
                            </table>
                            {/* {pokemon.stats.map((stat) => (
                                <li key={stat.stat.name}>
                                    <span className="capitalize">{stat.stat.name}:</span> {stat.base_stat}
                                </li>
                            ))} */}
                        </ul>
                    </div>
                    <button
                        className="px-6 py-2 mt-8 font-bold text-black transition rounded shadow bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700"
                        onClick={() => setPokemon(null)}
                    >
                        Accept
                    </button>
                </div>
            </div>
             )}
            {!loading && !pokemon && (
                <div className='flex items-center justify-center mb-4'>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ">
                        <Button
                            type="submit" 
                            className="w-full mt-4 btn-primary"
                            style={{backgroundColor: '#c7a24a'}}
                            onClick={() => {
                                if(window.confirm("Are you sure you want to buy a Poke Ball?")) {
                                    setLoading(true);
                                    setTimeout(() => {
                                        buyPokeBall();
                                    }, 1000)
                                }
                            }}
                        >
                            <img src="\src\assets\img\pokeball.png" alt=""/>
                            150 PokeDollars
                        </Button>
                    
                        <Button
                            type="submit" 
                            className="w-full mt-4 btn-primary"
                            style={{backgroundColor: '#c7a24a'}}
                            onClick={() => {
                                if(window.confirm("Are you sure you want to buy a Great Ball?")) {
                                    buyGreatBall();
                                }
                            }}
                        >
                            <img src="\src\assets\img\greatball.jpg" alt="" />
                            450 PokeDollars
                        </Button>
                    </div>
                </div>
            )}
        </div>
        </div>
    );

}
export default Pokeballs;