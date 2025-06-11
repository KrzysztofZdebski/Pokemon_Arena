function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pokemon-blue">
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            About Pokemon Arena
          </h1>
          <p className="text-white/80 text-xl">
            Learn more about our Pokemon battle simulator!
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="pokemon-card mb-8">
            <h2 className="text-3xl font-bold mb-6">What is Pokemon Arena?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
              Pokemon Arena is an exciting battle simulator where trainers can test their skills 
              against various opponents. Build your perfect team, train your Pokemon, and climb 
              the ranks to become the ultimate Pokemon Champion!
            </p>
            
            <h3 className="text-2xl font-semibold mb-4">Features</h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-pokemon-red rounded-full mr-3"></span>
                Battle against AI trainers with varying difficulty levels
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-pokemon-blue rounded-full mr-3"></span>
                Collect and train over 150 different Pokemon
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-pokemon-yellow rounded-full mr-3"></span>
                Participate in tournaments and gym challenges
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Track your battle statistics and achievements
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Customize your trainer profile and team
              </li>
            </ul>
          </div>

          <div className="pokemon-card">
            <h3 className="text-2xl font-semibold mb-4">How to Play</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium mb-2">1. Build Your Team</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose up to 6 Pokemon for your battle team. Consider type advantages and move sets.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">2. Enter Battle</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Select your battle mode and face off against opponents in turn-based combat.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">3. Strategic Combat</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Use moves, items, and Pokemon switches strategically to win battles.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">4. Grow Stronger</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Win battles to gain experience, level up your Pokemon, and unlock new abilities.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default About
