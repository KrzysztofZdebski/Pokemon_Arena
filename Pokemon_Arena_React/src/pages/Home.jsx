import { useState } from 'react'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pokemon-blue to-pokemon-red">
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Pokemon Arena
          </h1>
          <p className="text-white/80 text-xl">
            Battle your favorite Pokemon!
          </p>
        </header>

        <main className="flex justify-center mb-16">
          <div className="pokemon-card max-w-md">
            <h2 className="text-2xl font-semibold mb-6">Welcome Trainer!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Click the button to start your Pokemon journey.
            </p>
            <button
              className="btn-primary w-full mb-6"
              onClick={() => setCount((count) => count + 1)}
            >
              Battles Won: {count}
            </button>
            <button className="btn-secondary w-full">
              Reset Battle
            </button>
          </div>
        </main>

        {/* Test Section for Custom Colors */}
        <section className="text-center space-y-8">
          <h3 className="text-white text-2xl mb-8">Color Test</h3>
          <div className="flex justify-center space-x-8 mb-8">
            <div className="bg-pokemon-red text-white p-6 rounded-lg shadow-lg">Red</div>
            <div className="bg-pokemon-blue text-white p-6 rounded-lg shadow-lg">Blue</div>
            <div className="bg-pokemon-yellow text-black p-6 rounded-lg shadow-lg">Yellow</div>
          </div>
          <div className="flex justify-center space-x-8">
            <span className="text-pokemon-red text-2xl font-bold">Red Text</span>
            <span className="text-pokemon-blue text-2xl font-bold">Blue Text</span>
            <span className="text-pokemon-yellow text-2xl font-bold">Yellow Text</span>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
