import React, { useContext } from "react";
import Logout from "../components/Logout";
import Ranking from "../components/Ranking";
import AuthContext from "../utils/authProvider";

function Account() {
    const {username, email} = useContext(AuthContext);

    return (
        <div className="flex items-center justify-center w-screen min-h-screen p-4 bg-striped-yellow">
            <div className="flex flex-col items-center justify-center w-full max-w-2xl px-8 py-12 border-4 border-white shadow-2xl bg-menu-blue bg-opacity-90 rounded-2xl">
                <h1 className="mb-2 text-2xl md:text-3xl lg:text-4xl font-bold text-pokemon-yellow tracking-wider text-center drop-shadow-[0_0_5px_rgba(255,255,255,0.75)] break-words">
                    Witaj, {username}!
                </h1>
                <p className="mb-6 text-lg md:text-xl lg:text-2xl text-pokemon-yellow text-center drop-shadow-[0_0_5px_rgba(255,255,255,0.75)] break-words">
                    Email: {email}
                </p>
                <h2 className="mb-8 text-2xl md:text-3xl lg:text-4xl font-bold text-pokemon-yellow tracking-wider text-center drop-shadow-[0_0_5px_rgba(255,255,255,0.75)]">
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

