import React, { useEffect, useState } from "react";
import authApi from '../utils/authApi';

function Ranking() {
  const [userRanking, setUserRanking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await authApi.get("api/v1/ranking/");
        setUserRanking(response.data);
      } catch (error) {
        setUserRanking(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  if (loading) return (
    <div className="w-full flex justify-center">
      <p className="text-white font-[PokemonFont] text-lg">Ładowanie rankingu...</p>
    </div>
  );

  if (!userRanking)
    return (
      <div className="w-full flex justify-center">
        <p className="text-white font-[PokemonFont] text-lg">Nie udało się pobrać rankingu.</p>
      </div>
    );

  return (
    <div className="w-full flex justify-center">
      <div className="bg-menu-yellow bg-opacity-90 rounded-xl p-6 border-2 border-menu-blue flex flex-col items-center w-72">
        <span className="text-xl font-[PokemonFont] text-pokemon-blue mb-2">Punkty rankingowe</span>
        <span className="text-3xl font-[PokemonFont] text-white mb-2">{userRanking.ranking}</span>
        <span className="text-lg font-[PokemonFont] text-pokemon-red">
          Poziom: {userRanking.level}
        </span>
      </div>
    </div>
  );
}

export default Ranking;




