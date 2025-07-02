import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../utils/authProvider';
import React, { useContext } from 'react';

function Navbar() {
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/battle", label: "Battle" },
    { to: "/pokemon", label: "Pokemon" },
    { to: "/pokeballs", label: "Pokeballs" },
    { to: "/about", label: "About" },
    isAuthenticated
      ? { to: "/account", label: "Account" }
      : { to: "/login", label: "Login" },
  ];

  return (
    <nav className="fixed top-0 left-0 z-50 lg:w-[99vw] md:w-[99vw] sm:w-[100vw]">
      {/* Żółte tło za granatowym paskiem */}
      <div className="px-4 py-3 bg-menu-yellow">
        {/* Granatowy pasek */}
        <div className="px-4 py-3 mx-auto rounded-lg bg-menu-blue border-3 border-menu-white max-w-7xl font-pokemon">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-2">
            {/* Logo */}
            <Link
              to="/"
              className="text-2xl font-bold text-center text-white sm:text-4xl whitespace-nowrap sm:text-left"
            >
              Pokemon Arena
            </Link>

            {/* Linki – zawijane automatycznie */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {navLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className={`group text-sm sm:text-base md:text-xl text-white hover:text-pokemon-yellow transition ${
                    isActive(link.to) ? "text-pokemon-yellow" : ""
                  }`}
                >
                  <span className="pr-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                    {" "}
                    ▶
                  </span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;


