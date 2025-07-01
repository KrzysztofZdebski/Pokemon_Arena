import React, { useState, useEffect, use } from "react";
import Button from "../components/Button";
import authApi from "../utils/authApi";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";

function Pokeballs() {
    const [pokemon, setPokemon] = useState(null);
    const [loading, setLoading] = useState(false);
   
    const buyPokeBall = async () =>{
        setLoading(true);
        try{
            const res = await authApi.get('api/v1/pokeballs/');
            const poke = res.data.pokemon;
            // setPokemon(res.pokemon)
            alert(`You caught a ${res.data.name}`);
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
            //setPokemon(res.pokemon)
            alert(`You caught a ${res.data.name}`);
            setPokemon(poke);
        }catch(err){
            setPokemon(null);
            alert("Error fetching Pokémon data. Please try again later.");
        }
        setLoading(false);
    }
    

  return (
    <div style={{ padding: 25 }}>
        {/* <h1>Pokémon Stat Scores</h1> */}
        <div className = 'flex justify-center items-center mb-4'>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Button
                    type="submit" 
                    className="w-full mt-4 btn-primary"
                    style={{backgroundColor: '#c7a24a'}}
                    onClick={()=>{
                        buyPokeBall();
                    }}
                >
                    <img src="\src\original-dbe29920e290da99d214598ac9e2001f.webp" alt="" />
                    150 PokeDollars
                </Button>
                {/* {pokemon && (
                <div className="mt-4 flex flex-col items-center">
                    <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                    <div>{pokemon.name}</div>
                </div> */}
            {/* )} */}
                <Button
                    type="submit" 
                    className="w-full mt-4 btn-primary"
                    style={{backgroundColor: '#c7a24a'}}
                    onClick={()=>{
                    buyGreatBall();
                    }}
                    >
                        <img src="\src\assets\greatball.png" alt="" />
                        450 PokeDollars
                </Button>
            </div>
            {/* {pokemon && (
                <div
                    className="mt-8 mx-auto flex flex-col items-center justify-center rounded-lg shadow-lg relative"
                    style={{
                    width: 300,
                    height: 350,
                    background: "#fff",
                    border: "2px solid #c7a24a",
                    }}
                >
                    <button
                    onClick={() => setPokemon(null)}
                    style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "#eee",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                        fontWeight: "bold",
                        color: "black",
                        fontSize: 18,
                    }}
                    aria-label="Close"
                    >
                    ×
                    </button>
                    <img
                    src={pokemon.sprites.front_default}
                    alt={pokemon.name}
                    style={{ width: 120, height: 120, marginTop: 16 }}
                    />
                    <h2 className="text-xl font-bold mt-2 capitalize">{pokemon.name}</h2>
                    <div className="mt-4 w-full px-4">
                    <h3 className="font-semibold mb-2">Base Stats:</h3>
                    <ul className="text-left">
                        {pokemon.stats.map((stat) => (
                        <li key={stat.stat.name}>
                            <span className="capitalize">{stat.stat.name}:</span> {stat.base_stat}
                        </li>
                        ))}
                    </ul>
                    </div>
                </div>
            )} */}
        </div>
    </div>
    );
}
export default Pokeballs;