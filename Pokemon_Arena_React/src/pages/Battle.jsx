function Battle() {
  return (
    <>
    <div className="w-screen min-h-screen bg-gradient-to-br from-pokemon-red to-pokemon-yellow">
      <div className="container px-6 py-12 mx-auto">
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold text-white">
            Battle Arena
          </h1>
          <p className="text-xl text-white/80">
            Challenge trainers and their Pokemon!
          </p>
        </header>

        <main className="flex justify-center">
          <div className="max-w-2xl pokemon-card">
            <h2 className="mb-6 text-2xl font-semibold text-center">Choose Your Battle</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="p-6 text-white transition-shadow rounded-lg shadow-lg cursor-pointer bg-gradient-to-r from-red-500 to-red-600 hover:shadow-xl">
                <h3 className="mb-2 text-xl font-bold">Quick Battle</h3>
                <p>Jump into a random battle with any Pokemon!</p>
              </div>
              <div className="p-6 text-white transition-shadow rounded-lg shadow-lg cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-xl">
                <h3 className="mb-2 text-xl font-bold">Tournament</h3>
                <p>Compete in the championship tournament!</p>
              </div>
              <div className="p-6 text-white transition-shadow rounded-lg shadow-lg cursor-pointer bg-gradient-to-r from-green-500 to-green-600 hover:shadow-xl">
                <h3 className="mb-2 text-xl font-bold">Gym Challenge</h3>
                <p>Take on the Gym Leaders one by one!</p>
              </div>
              <div className="p-6 text-white transition-shadow rounded-lg shadow-lg cursor-pointer bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-xl">
                <h3 className="mb-2 text-xl font-bold">Elite Four</h3>
                <p>Face the ultimate challenge!</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  )
}

export default Battle
