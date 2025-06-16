import { useState } from 'react'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex justify-center w-screen">
      <div className="space-y-4 ">
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold text-white">
            Pokemon Arena
          </h1>
          <p className="text-xl text-white/80">
            Battle your favorite Pokemon!
          </p>
        </header>

        <main className="flex justify-center mb-16">
          <div className="max-w-md pokemon-card">
            <h2 className="mb-6 text-2xl font-semibold">Welcome Trainer!</h2>
            <p className="mb-8 text-gray-600 dark:text-gray-300">
              Click the button to start your Pokemon journey.
            </p>
            <button
              className="w-full mb-6 btn-primary"
              onClick={() => setCount((count) => count + 1)}
            >
              Battles Won: {count}
            </button>
            <button className="w-full btn-secondary">
              Reset Battle
            </button>
          </div>
        </main>

        {/* Test Section for Custom Colors */}
        <section className="space-y-8 text-center">
          <h3 className="mb-8 text-2xl text-white">Color Test</h3>
          <div className="flex justify-center mb-8 space-x-8">
            <div className="p-6 text-white rounded-lg shadow-lg bg-pokemon-red">Red</div>
            <div className="p-6 text-white rounded-lg shadow-lg bg-pokemon-blue">Blue</div>
            <div className="p-6 text-black rounded-lg shadow-lg bg-pokemon-yellow">Yellow</div>
          </div>
          <div className="flex justify-center space-x-8">
            <span className="text-2xl font-bold text-pokemon-red">Red Text</span>
            <span className="text-2xl font-bold text-pokemon-blue">Blue Text</span>
            <span className="text-2xl font-bold text-pokemon-yellow">Yellow Text</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home
