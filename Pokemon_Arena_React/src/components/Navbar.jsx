import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="border-b bg-white/10 backdrop-blur-sm border-white/20">
      <div className="container px-6 mx-auto">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-white">
            Pokemon Arena
          </Link>
          
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
              }`}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
