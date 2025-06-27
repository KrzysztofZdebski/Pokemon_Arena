import React, { useState, useEffect } from "react";
const POKEAPI_BASE = "https://pokeapi.co/api/v2";
function calculateScore(stats){
    return stats.reduce((sum,s) => {
        let val = s.base_stat;
        switch(s.stat.name){
            case 'defense':
                val *= 1.5;
                break;
            case 'special-attack':
                val *= 1.3;
                break;
            case 'special-defense':
                val *= 1.2;
                break;
            case 'speed':
                val *= 1.3;
                break;
            case 'attack':
                val *= 1.8;
                break;
            case 'hp':
                val *=1.7;
                break;
            default:
                // No multiplier for other stats
        }
        return Math.round(sum+val);
    },0);
}
function Pokeballs() {
    const [pokemonList, setPokemonList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch list of first N Pokémon (can be paginated/extended)
        async function fetchBaseEvoPokemons() {
        setLoading(true);
        try {
            // Fetch 20 for demo; you can increase this number
            const resp = await fetch(`${POKEAPI_BASE}/pokemon?limit=200 && {POKEAPI_BASE}/generation/${'Generation I'}`);
            const data = await resp.json();
            // Fetch details for each pokemon
            const details = await Promise.all(
                data.results.map(async (poke) => {
                    const speciesResp = await fetch(`${POKEAPI_BASE}/pokemon-species/${poke.name}`);
                    const speciestData = await speciesResp.json();

                    if (speciestData.evolves_from_species == null &&
                        speciestData.generation.name == 'generation-i'
                    ){
                        const detailsResp = await fetch(poke.url);
                        const detailsData = await detailsResp.json();
                        return {
                        name: detailsData.name,
                        stats: detailsData.stats,
                        sprite: detailsData.sprites.front_default,
                        score: calculateScore(detailsData.stats),
                        };
                    }
                    return null;
                })
            );
            setPokemonList(details.filter((d) => d));
        } catch (err) {
            console.error("Failed to fetch Pokémon:", err);
        } finally {
            setLoading(false);
        }
        }
        fetchBaseEvoPokemons();
    }, []);

    return (
        <div style={{ padding: 25 }}>
        <h1>Pokémon Stat Scores</h1>
        {loading ? (
            <div>Loading Pokémon...</div>
        ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
                <tr>
                <th>Sprite</th>
                <th>Name</th>
                <th>Stats</th>
                <th>Score</th>
                </tr>
            </thead>
            <tbody>
                {pokemonList.map((poke) => (
                <tr key={poke.name} style={{ borderBottom: "1px solid #ccc" }}>
                    <td>
                    <img src={poke.sprite} alt={poke.name} />
                    </td>
                    <td>{poke.name}</td>
                    <td>
                    {poke.stats
                        .map(
                        (s) =>{
                            const statStr = `${s.stat.name.replace("-", " ")}: ${s.base_stat}`;
                            if(s.stat.name == 'speed'){
                                return statStr + ' | ⚡️'; 
                            }
                            return statStr
                        }
                        )
                        .join(", ")}
                    </td>
                    <td>
                        <p> {poke.score}</p>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        </div>
    );
}
export default Pokeballs;