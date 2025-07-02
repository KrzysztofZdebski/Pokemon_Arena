function About() {
  return (
    <>
    <div className="lg:w-[99vw] md:w-[99vw] sm:w-[100vw] min-h-screen max-w-screen mt-26">
      <div className="container px-6 py-12 mx-auto pt-28">
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold text-white">
            About Pokemon Arena
          </h1>
          <p className="text-xl text-white/80">
            Learn more about our Pokemon battle simulator!
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="mb-8 pokemon-card">
            <h2 className="mb-6 text-3xl font-bold">What is Pokemon Arena?</h2>
            <p className="mb-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Pokemon Arena is an exciting battle simulator where trainers can test their skills 
              against various opponents. Build your perfect team, train your Pokemon, and climb 
              the ranks to become the ultimate Pokemon Champion!
            </p>
            
            <h3 className="mb-4 text-2xl font-semibold">Features</h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <span className="w-2 h-2 mr-3 rounded-full bg-pokemon-red"></span>
                Battle against AI trainers with varying difficulty levels
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 mr-3 rounded-full bg-pokemon-blue"></span>
                Collect and train over 150 different Pokemon
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 mr-3 rounded-full bg-pokemon-yellow"></span>
                Participate in tournaments and gym challenges
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 mr-3 bg-green-500 rounded-full"></span>
                Track your battle statistics and achievements
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 mr-3 bg-purple-500 rounded-full"></span>
                Customize your trainer profile and team
              </li>
            </ul>
          </div>

          <div className="mb-8 pokemon-card">
            <h3 className="mb-4 text-2xl font-semibold">How to Play</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-lg font-medium">1. Build Your Team</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose up to 6 Pokemon for your battle team. Consider type advantages and move sets.
                </p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-medium">2. Enter Battle</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Select your battle mode and face off against opponents in turn-based combat.
                </p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-medium">3. Strategic Combat</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Use moves, items, and Pokemon switches strategically to win battles.
                </p>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-medium">4. Grow Stronger</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Win battles to gain pokeDollars and spend them on making your Pokemon stronger.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 pokemon-card">
            <h3 className="mb-6 text-2xl font-semibold">Art Credits</h3>
            <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
              We would like to thank the talented artists who created the beautiful artwork used in our game.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 text-3xl text-white rounded-full bg-pokemon-red">
                  ⚪
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  Pokeball Artwork
                </h4>
                <a 
                  href="https://www.deviantart.com/oykawoo/art/Pokeball-494307320" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium transition-colors text-pokemon-blue hover:text-pokemon-blue/80"
                >
                  by oykawoo on DeviantArt
                </a>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 text-3xl text-white rounded-full bg-pokemon-blue">
                  ⚪
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  Great Ball Artwork
                </h4>
                <a 
                  href="https://www.deviantart.com/oykawoo/art/Great-Ball-494308740" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium transition-colors text-pokemon-blue hover:text-pokemon-blue/80"
                >
                  by oykawoo on DeviantArt
                </a>
              </div>
            </div>
          </div>

          <div className="pokemon-card">
            <h3 className="mb-6 text-2xl font-semibold">Meet the Developers</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl font-bold text-white rounded-full bg-pokemon-red">
                  BT
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  Bartosz Tochowicz
                </h4>
                <a 
                  href="https://github.com/BartoszTochowicz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium transition-colors text-pokemon-blue hover:text-pokemon-blue/80"
                >
                  @BartoszTochowicz
                </a>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl font-bold text-white rounded-full bg-pokemon-blue">
                  KZ
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  Krzysztof Zdebski
                </h4>
                <a 
                  href="https://github.com/KrzysztofZdebski" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium transition-colors text-pokemon-blue hover:text-pokemon-blue/80"
                >
                  @KrzysztofZdebski
                </a>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl font-bold text-white rounded-full bg-pokemon-yellow">
                  MS
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  Mateusz Sondej
                </h4>
                <a 
                  href="https://github.com/MateuszS04" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium transition-colors text-pokemon-blue hover:text-pokemon-blue/80"
                >
                  @MateuszS04
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  )
}

export default About
