import React, { useState, useEffect, use } from "react";
import Button from "../components/Button";
import authApi from "../utils/authApi";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";

function Pokeballs() {
    const [pokemon, setPokemon] = useState(null);
    const [loading, setLoading] = useState(false);
    function loadingSpinner() {
    }
   
    const buyPokeBall = async () =>{
        try{
            const res = await authApi.get('api/v1/pokeballs/');
            const poke = res.data.pokemon;
            // setPokemon(res.pokemon)
            setPokemon(poke);
        }catch(err){
            setPokemon(null);
            alert("Error fetching Pokémon data. Please try again later.");
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
        }
    }
    

  return (
        <div style={{ padding: 25 }}>
            {loading && (
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <div>Loading Pokemon</div>
                </div>
            )}
            {!loading && pokemon && (
            <div className="flex justify-center items-center min-h-screen w-full bg-gradient-to-br from-pokemon-red to-pokemon-yellow">
                <div className="max-w-md w-full p-8 rounded-lg shadow-lg bg-white flex flex-col items-center relative">
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
                    <h2 className="text-2xl font-bold mt-4 capitalize text-gray-900">{pokemon.name}</h2>
                    <div className="mt-6 w-full px-2">
                        <h3 className="font-semibold mb-2 text-gray-800">Base Stats:</h3>
                        <ul className="text-left text-gray-700">
                            {pokemon.stats.map((stat) => (
                                <li key={stat.stat.name}>
                                    <span className="capitalize">{stat.stat.name}:</span> {stat.base_stat}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        className="mt-8 px-6 py-2 rounded bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold shadow hover:from-yellow-500 hover:to-yellow-700 transition"
                        onClick={() => setPokemon(null)}
                    >
                        Accept
                    </button>
                </div>
            </div>
             )}
            {!loading && !pokemon && (
                <div className='flex justify-center items-center mb-4'>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
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
    );

}
export default Pokeballs;