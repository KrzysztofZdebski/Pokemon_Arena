from flask import Blueprint,request, jsonify
from app.modules.poke_training.controller import PokemonController


pokemon_bp = Blueprint('pokemon', __name__)
pokemoncontroller=PokemonController()

@pokemon_bp.route('/train', methods=['POST'])
def train():
    """
    Start training a Pokémon
    ---
    tags:
      - Pokémon
    parameters:
      - name: body
        in: body
        required: true
        schema:
          id: TrainPokemon
          required:
            - user_id
            - pokemon_id
          properties:
            user_id:
              type: string
            pokemon_id:
              type: string
            duration:
              type: integer
              default: 5
    responses:
      200:
        description: Training started
      400:
        description: Already training
      404:
        description: Not found
    """
    data=request.get_json()
    user_id = data.get('user_id')
    pokemon_id = data.get('pokemon_id')
    duration= data.get('duration_minutes', 30)  # Default to 30 minutes if not provided
    return pokemoncontroller.start_training(pokemon_id, user_id, duration)

@pokemon_bp.route('/status',methods=['GET'])
def status():
    """
    Get status of a Pokémon
    ---
    tags:
      - Pokémon
    parameters:
      - name: user_id
        in: query
        type: string
        required: true
      - name: pokemon_id
        in: query
        type: string
        required: true
    responses:
      200:
        description: Status returned
      404:
        description: Not found
    """
    user_id = request.args.get('user_id')
    pokemon_id = request.args.get('pokemon_id')
    return pokemoncontroller.get_pokemon_status(user_id, pokemon_id)




