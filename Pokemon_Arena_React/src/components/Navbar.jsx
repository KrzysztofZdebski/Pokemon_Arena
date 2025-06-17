import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (    
  	<nav className="fixed inset-0 flex items-center justify-center w-full px-10 py-5 h-18 place-content-center">
      <div className="container justify-center w-4/5 h-20 mx-auto bg-menu-gray/0 max-w-7xl place-content-center">
        <div className="flex items-center justify-center mx-auto rounded-lg border-7 w-97/100 h-85/100 bg-menu-yellow border-menu-yellow">
          <div className="flex items-center justify-between w-full h-full px-4 rounded-md font-pokemon border-menu-white border-3 size-fit bg-menu-blue">
            <Link to="/" className="text-4xl font-bold text-white">
              Pokemon Arena
            </Link>
            
            <div className="flex flex-1">
              <div className="flex w-full space-x-8 justify-evenly">
              <Link
                to="/"
                className={`group text-white text-xl hover:text-pokemon-yellow transition-colors ${
                  isActive('/') ? 'text-pokemon-yellow' : ''
                }`}
              >
                <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                Home
              </Link>
              <Link
                to="/battle"
                className={`group text-white text-xl hover:text-pokemon-yellow transition-colors ${
                  isActive('/battle') ? 'text-pokemon-yellow' : ''
                }`}
              >
                <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                Battle
              </Link>
              <Link
                to="/pokemon"
                className={`group text-white text-xl hover:text-pokemon-yellow transition-colors ${
                  isActive('/pokemon') ? 'text-pokemon-yellow' : ''
                }`}
              >
                <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                Pokemon
              </Link>            <Link
                to="/about"
                className={`group text-white text-xl hover:text-pokemon-yellow transition-colors ${
                  isActive('/about') ? 'text-pokemon-yellow' : ''
                }`}
              >
                <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                About
              </Link>
              <Link
                to="/login"
                className={`group text-white text-xl hover:text-pokemon-yellow transition-colors ${
                  isActive('/login') ? 'text-pokemon-yellow' : ''
                }`}            >
                <span className="mr-2 transition-opacity opacity-0 group-hover:opacity-100">▶</span>
                Login
              </Link>
              </div>
              </div>
            </div>
          </div>
      </div>
    </nav>
  )
}

export default Navbar
