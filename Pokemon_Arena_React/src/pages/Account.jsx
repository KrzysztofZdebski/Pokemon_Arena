import React from "react";
import Logout from "../components/Logout";
import Ranking from "../components/Ranking";

function Account() {
    return (
        <div className="w-screen min-h-screen flex items-center justify-center bg-striped-yellow">
            <div className="flex flex-col items-center justify-center w-full max-w-md bg-menu-blue bg-opacity-90 rounded-2xl shadow-2xl border-4 border-menu-yellow px-6 py-10">
                <h2
                  className="mb-8 text-3xl md:text-4xl font-bold text-pokemon-yellow font-[PokemonFont] tracking-wider text-center drop-shadow-[0_0_5px_rgba(255,255,255,0.75)]"
                  style={{ fontFamily: "PokemonFont, monospace" }}
                >
                  Twój Ranking
                </h2>
                <Ranking />
                <div className="mt-8 w-full flex justify-center">
                    <Logout />
                </div>
            </div>
        </div>
    );
}

export default Account;

