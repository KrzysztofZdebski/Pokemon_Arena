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
    <nav className="fixed top-0 left-0 w-full z-50">
      {/* Żółte tło za granatowym paskiem */}
      <div className="bg-menu-yellow px-4 py-3">
        {/* Granatowy pasek */}
        <div className="bg-menu-blue border-3 border-menu-white rounded-lg max-w-7xl mx-auto px-4 py-3 font-pokemon">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-2">
            {/* Logo */}
            <Link
              to="/"
              className="text-2xl sm:text-4xl font-bold text-white whitespace-nowrap text-center sm:text-left"
            >
              Pokemon Arena
            </Link>

            {/* Linki – zawijane automatycznie */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {navLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className={`text-sm sm:text-base md:text-xl text-white hover:text-pokemon-yellow transition ${
                    isActive(link.to) ? "text-pokemon-yellow" : ""
                  }`}
                >
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


