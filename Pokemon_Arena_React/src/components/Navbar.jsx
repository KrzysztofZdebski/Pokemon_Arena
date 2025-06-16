import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (    
  	<nav className="fixed inset-0 flex items-center justify-between w-full h-16 px-10 py-5">
      <div className="container w-3/5 px-6 mx-auto bg-white">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-black">
            Pokemon Arena
          </Link>
          
          <div className="flex justify-center flex-1">
            <div className="flex space-x-8">
            <Link
              to="/"
              className={`text-white hover:text-pokemon-yellow transition-colors ${
                isActive('/') ? 'text-pokemon-yellow font-semibold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/battle"
              className={`text-white hover:text-pokemon-yellow transition-colors ${
                isActive('/battle') ? 'text-pokemon-yellow font-semibold' : ''
              }`}
            >
              Battle
            </Link>
            <Link
              to="/pokemon"
              className={`text-white hover:text-pokemon-yellow transition-colors ${
                isActive('/pokemon') ? 'text-pokemon-yellow font-semibold' : ''
              }`}
            >
              Pokemon
            </Link>            <Link
              to="/about"
              className={`text-white hover:text-pokemon-yellow transition-colors ${
                isActive('/about') ? 'text-pokemon-yellow font-semibold' : ''
              }`}
            >
              About
            </Link>
            <Link
              to="/login"
              className={`text-white hover:text-pokemon-yellow transition-colors ${
                isActive('/login') ? 'text-pokemon-yellow font-semibold' : ''
              }`}            >
              Login
            </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
