function Battle() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pokemon-red to-pokemon-yellow">
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Battle Arena
          </h1>
          <p className="text-white/80 text-xl">
            Challenge trainers and their Pokemon!
          </p>
        </header>

        <main className="flex justify-center">
          <div className="pokemon-card max-w-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-center">Choose Your Battle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <h3 className="text-xl font-bold mb-2">Quick Battle</h3>
                <p>Jump into a random battle with any Pokemon!</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <h3 className="text-xl font-bold mb-2">Tournament</h3>
                <p>Compete in the championship tournament!</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <h3 className="text-xl font-bold mb-2">Gym Challenge</h3>
                <p>Take on the Gym Leaders one by one!</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <h3 className="text-xl font-bold mb-2">Elite Four</h3>
                <p>Face the ultimate challenge!</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Battle
