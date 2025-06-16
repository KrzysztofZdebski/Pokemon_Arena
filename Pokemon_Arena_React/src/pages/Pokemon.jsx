function Pokemon() {
  const samplePokemon = [
    { id: 1, name: "Pikachu", type: "Electric", level: 25 },
    { id: 2, name: "Charizard", type: "Fire/Flying", level: 36 },
    { id: 3, name: "Blastoise", type: "Water", level: 34 },
    { id: 4, name: "Venusaur", type: "Grass/Poison", level: 32 },
    { id: 5, name: "Gengar", type: "Ghost/Poison", level: 28 },
    { id: 6, name: "Dragonite", type: "Dragon/Flying", level: 40 },
  ]

  return (
    <>
    <div className="w-screen min-h-screen bg-gradient-to-br from-pokemon-yellow to-pokemon-blue">
      <div className="container px-6 py-12 mx-auto">
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold text-white">
            Pokemon Collection
          </h1>
          <p className="text-xl text-white/80">
            Manage your Pokemon team!
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {samplePokemon.map((pokemon) => (
              <div key={pokemon.id} className="pokemon-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{pokemon.name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    Lv. {pokemon.level}
                  </span>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-300">Type: {pokemon.type}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 btn-primary">Battle</button>
                  <button className="flex-1 btn-secondary">Details</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="btn-primary">
              Catch New Pokemon
            </button>
          </div>
        </main>
      </div>
    </div>
    </>
  )
}

export default Pokemon
