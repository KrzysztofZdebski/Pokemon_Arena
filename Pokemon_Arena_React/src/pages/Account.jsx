import React, { useContext } from "react";
import Logout from "../components/Logout";
import Ranking from "../components/Ranking";

function Account() {
    const {username, email} = useContext(AuthContext);

    return (
        <div className="flex items-center justify-center w-screen min-h-screen bg-striped-yellow">
            <div className="flex flex-col items-center justify-center w-full max-w-md px-6 py-10 border-4 shadow-2xl bg-menu-blue bg-opacity-90 rounded-2xl border-menu-yellow">
                <h2
                  className="mb-8 text-3xl md:text-4xl font-bold text-pokemon-yellow font-[PokemonFont] tracking-wider text-center drop-shadow-[0_0_5px_rgba(255,255,255,0.75)]"
                  style={{ fontFamily: "PokemonFont, monospace" }}
                >
                  Twój Ranking
                </h2>
                <Ranking />
                <div className="flex justify-center w-full mt-8">
                    <Logout />
                </div>
            </div>
        </div>
    );
}

export default Account;

