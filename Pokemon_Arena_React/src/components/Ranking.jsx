import React, { useEffect, useState } from "react";
import axios from "axios";

function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.error("Brak tokena JWT. Użytkownik nie jest zalogowany.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/ranking", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRanking(response.data);
      } catch (error) {
        console.error("Błąd podczas pobierania rankingu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  if (loading) return <p className="text-white">Ładowanie rankingu...</p>;

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-xl font-bold text-white">Top Trainers</h3>
      <ul className="text-white space-y-2">
        {ranking.map((user, index) => (
          <li
            key={user.username}
            className="flex justify-between px-4 py-2 bg-white/10 rounded-lg"
          >
            <span>
              {index + 1}. {user.username}
            </span>
            <span>{user.score} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Ranking;
