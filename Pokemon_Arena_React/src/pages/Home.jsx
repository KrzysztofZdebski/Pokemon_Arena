import { Link } from 'react-router-dom'
import { useContext } from 'react';
import AuthContext from '../utils/authProvider';

function Home() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-br mt-26 lg:w-[99vw] md:w-[99vw] sm:w-[100vw]">
      <div className="container px-6 py-12 mx-auto pt-28">
        
        {/* Hero Section */}
        <header className="mb-20 text-center">
          <h1 className="mb-6 text-6xl md:text-7xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
            Pokemon Arena
          </h1>
          <p className="max-w-3xl mx-auto mb-8 text-2xl md:text-3xl text-white/90">
            The ultimate Pokemon battle experience awaits you!
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to={`${isAuthenticated ? "/battle" : "/login"}`} className="px-8 py-4 text-xl font-bold text-white transition-all duration-300 transform rounded-lg shadow-lg bg-pokemon-red hover:bg-red-600 hover:scale-105">
              Start Your Journey
            </Link>
            <Link to="/about" className="px-8 py-4 text-xl font-bold transition-all duration-300 transform bg-white rounded-lg shadow-lg text-pokemon-blue hover:bg-gray-100 hover:scale-105">
              Learn More
            </Link>
          </div>
        </header>

        {/* Features Section */}
        <section className="mb-20">
          <h2 className="mb-12 text-4xl font-bold text-center text-white md:text-5xl">
            What Makes Us Special?
          </h2>
          <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-3">
            
            {/* Feature 1 */}
            <div className="text-center border pokemon-card bg-white/10 backdrop-blur-sm border-white/20">
              <div className="mb-4 text-6xl">⚔️</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Epic Battles</h3>
              <p className="text-lg leading-relaxed text-white/80">
                Engage in strategic turn-based combat with real-time multiplayer battles. 
                Test your skills against trainers from around the world!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center border pokemon-card bg-white/10 backdrop-blur-sm border-white/20">
              <div className="mb-4 text-6xl">🎯</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Train & Evolve</h3>
              <p className="text-lg leading-relaxed text-white/80">
                Level up your Pokemon team through training sessions. 
                Master different moves and unlock your Pokemon's full potential!
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center border pokemon-card bg-white/10 backdrop-blur-sm border-white/20">
              <div className="mb-4 text-6xl">🏆</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Climb Rankings</h3>
              <p className="text-lg leading-relaxed text-white/80">
                Compete in ranked matches and climb the global leaderboard. 
                Earn PokeDollars and unlock rare Pokemon as you progress!
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto border pokemon-card bg-white/10 backdrop-blur-sm border-white/20">
            <h2 className="mb-8 text-3xl font-bold text-center text-white md:text-4xl">
              Join Our Growing Community
            </h2>
            <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
              <div>
                <div className="mb-2 text-4xl font-bold text-pokemon-yellow">150+</div>
                <div className="text-lg text-white/80">Pokemon Available</div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold text-pokemon-yellow">∞</div>
                <div className="text-lg text-white/80">Battle Strategies</div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold text-pokemon-yellow">24/7</div>
                <div className="text-lg text-white/80">Online Battles</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-20">
          <h2 className="mb-12 text-4xl font-bold text-center text-white md:text-5xl">
            How It Works
          </h2>
          <div className="grid max-w-6xl grid-cols-1 gap-6 mx-auto md:grid-cols-2 lg:grid-cols-4">
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl font-bold text-white rounded-full bg-pokemon-red">
                1
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Sign Up</h3>
              <p className="text-white/80">Create your trainer account</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl font-bold text-white rounded-full bg-pokemon-blue">
                2
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Build Team</h3>
              <p className="text-white/80">Collect Pokemon to build your ultimate battle team</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl font-bold text-black rounded-full bg-pokemon-yellow">
                3
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Train Hard</h3>
              <p className="text-white/80">Level up your Pokemon and teach them powerful new moves</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl font-bold text-white bg-green-500 rounded-full">
                4
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Battle!</h3>
              <p className="text-white/80">Challenge other trainers and become the Pokemon Champion</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="max-w-3xl mx-auto text-white pokemon-card bg-gradient-to-r from-pokemon-red to-pokemon-blue">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              Ready to Become a Pokemon Master?
            </h2>
            <p className="mb-8 text-xl text-white/90">
              Join thousands of trainers in the most exciting Pokemon battle arena ever created!
            </p>
            <Link 
              to={`${isAuthenticated ? "/battle" : "/login"}`} 
              className="inline-block px-10 py-4 text-xl font-bold transition-all duration-300 transform bg-white rounded-lg shadow-lg text-pokemon-blue hover:bg-gray-100 hover:scale-105"
            >
              Start Playing Now!
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home
