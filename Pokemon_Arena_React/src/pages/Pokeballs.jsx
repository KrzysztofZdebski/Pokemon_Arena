import React, { useState, useEffect, use } from "react";
import Button from "../components/Button";
import authApi from "../utils/authApi";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";

function Pokeballs() {
    const [pokemon, setPokemon] = useState([]);
    const [loading, setLoading] = useState(false);
   
    const buyPokeBall = async () =>{
        const res = await authApi.get('api/v1/gambling/pokeballs');
        setPokemon(res.pokemon)
    }
    

  return (
    <div style={{ padding: 25 }}>
        {/* <h1>Pokémon Stat Scores</h1> */}
        <div className = 'flex justify-center items-center mb-4'>

        {loading ? (
            <div>Loading Pokémon...</div>
        ) : (
           
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Button
                    type="submit" 
                    className="w-full mt-4 btn-primary"
                    style={{backgroundColor: '#c7a24a'}}
                    onClick={()=>{
                        buyPokeBall();
                        if (pokemon) {
                            alert(`You caught a ${pokemon.name}! Score: ${pokemon.score}, Catch Probability: ${(pokemon.catchProbability * 100).toFixed(4)}%`);
                        } else {
                            alert("No Pokémon available to catch!");
                        }
                    }}
                >
                    <img src="\src\original-dbe29920e290da99d214598ac9e2001f.webp" alt="" />
                    150 PokeDollars
                </Button>
            </div>
            
            
        )}
        </div>
    </div>
    );
}
export default Pokeballs;