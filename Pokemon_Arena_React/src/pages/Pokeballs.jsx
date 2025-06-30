import React, { useState, useEffect, use } from "react";
import Button from "../components/Button";
import authApi from "../utils/authApi";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";

function Pokeballs() {
    const [pokemon, setPokemon] = useState(null);
    const [loading, setLoading] = useState(false);
   
    const buyPokeBall = async () =>{
        // setLoading(true);
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

        {/* {loading ? (
            <div>Loading Pokémon...</div>
        ) : ( */}
           
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
                    {/* {pokemon && (
                    <div className="mt-4 flex flex-col items-center">
                        <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                        <div>{pokemon.name}</div>
                    </div>
                    )} */}
            </div>
            
        {/* )} */}
        </div>
    </div>
    );
}
export default Pokeballs;