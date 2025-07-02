from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from flasgger import swag_from
from app.modules.poke_training.controller import PokemonController
from app.db.models import db
import requests
from app.db.models import Pokemon

pokemon_bp = Blueprint('pokemon', __name__)
pokemoncontroller = PokemonController()

@pokemon_bp.route('/status', methods=['GET'])
@jwt_required()
def status():
    """
    Zwraca status treningu wybranego Pokémona.
    ---
    tags:
      - Pokémon
    security:
      - Bearer: []
    parameters:
      - in: header
        name: Authorization
        required: true
        type: string
        description: Token JWT (w formacie Bearer <twój_token>)
      - in: query
        name: pokemon_id
        type: integer
        required: true
        description: ID pokemona
    responses:
      200:
        description: Status returned
      400:
        description: Invalid query parameters
      401:
        description: Unauthorized
      404:
        description: Pokemon not found
    """
    try:
        user_id = current_user.id
        pokemon_id = int(request.args.get('pokemon_id'))
    except (TypeError, ValueError, AttributeError):
        return jsonify({"error": "Invalid query parameters"}), 400

    return pokemoncontroller.get_pokemon_status(user_id, pokemon_id)





@pokemon_bp.route('/mock/catch', methods=['POST'])
@jwt_required()
def catch_mock_pokemon():
    """
    Pobiera przykładowego pokemona z PokeAPI i przypisuje go do użytkownika.
    ---
    tags:
      - Pokémon
    security:
      - Bearer: []
    parameters:
      - in: header
        name: Authorization
        required: true
        type: string
        description: Token JWT (w formacie Bearer <twój_token>)
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            pokemon_name:
              type: string
              example: pikachu
    responses:
      200:
        description: Pokemon złapany i dodany do użytkownika!
      404:
        description: Nie znaleziono pokemona lub użytkownika
    """
    data = request.get_json() or {}
    pokemon_name = data.get("pokemon_name", "pikachu").lower()

    
    response = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_name}")#pobierani danych pokemona
    if response.status_code != 200:
        return jsonify({"error": "Pokemon not found in PokeAPI"}), 404

    poke = response.json()
    user = current_user
    if not user:
        return jsonify({"error": "User not found"}), 404


    new_pokemon = Pokemon(
        name=poke["name"].capitalize(),
        owner_id=user.id,
        base_experience=poke.get("base_experience"),
        height=poke.get("height"),
        weight=poke.get("weight"),
        is_default=poke.get("is_default"),
        order=poke.get("order"),
        abilities=poke.get("abilities"),
        forms=poke.get("forms"),
        held_items=poke.get("held_items"),
        location_area_encounters=poke.get("location_area_encounters"),
        moves=poke.get("moves"),
        past_types=poke.get("past_types"),
        past_abilities=poke.get("abilities"),
        sprites=poke.get("sprites"),
        cries=poke.get("cries"),
        species=poke.get("species"),
        stats=poke.get("stats"),
        types=poke.get("types"),
    )

    db.session.add(new_pokemon)
    db.session.commit()
    return jsonify({"message": f"{poke['name'].capitalize()} złapany!", "pokemon": new_pokemon.to_dict()}), 200




@pokemon_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_pokemons():
    """
    Zwraca wszystkie pokemony przypisane do aktualnego użytkownika.
    ---
    tags:
      - Pokémon
    security:
      - Bearer: []
    parameters:
      - in: header
        name: Authorization
        required: true
        type: string
        description: Token JWT (w formacie Bearer <twój_token>)
    responses:
      200:
        description: Lista pokemonów użytkownika
      404:
        description: User not found
    """
    user = current_user
    if not user:
        return jsonify({"error": "User not found"}), 404

    pokemons = user.pokemons
    return jsonify([p.to_dict() for p in pokemons]), 200


@pokemon_bp.route('/train', methods=['POST'])
@jwt_required()
def train():
    """
    Rozpoczyna trening wybranego Pokémona o wybraną liczbę poziomów.
    ---
    tags:
      - Pokémon
    security:
      - Bearer: []
    parameters:
      - in: header
        name: Authorization
        required: true
        type: string
        description: Token JWT (w formacie Bearer <twój_token>)
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            pokemon_id:
              type: integer
              example: 5
            duration_minutes:
              type: integer
              default: 30
              example: 15
            levels:
              type: integer
              default: 1
              example: 3
          required:
            - pokemon_id
    responses:
      200:
        description: Training started
      400:
        description: Invalid input data
      401:
        description: Unauthorized
      404:
        description: Pokemon or User not found
      402:
        description: Not enough Poké Dollars
    """
    data = request.get_json() or {}
    try:
        user_id = current_user.id
        pokemon_id = int(data.get('pokemon_id'))
        duration = int(data.get('duration_minutes', 30))
        levels = int(data.get('levels', 1))
    except (TypeError, ValueError, AttributeError):
        return jsonify({"error": "Invalid input data"}), 400

    return pokemoncontroller.start_training(pokemon_id, user_id, duration, levels)


@pokemon_bp.route('/training_cost', methods=['POST'])
@jwt_required()
def get_training_cost():
    """
    Wylicza koszt treningu dla wybranego pokemona i liczby poziomów.
    ---
    tags:
      - Pokémon
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            pokemon_id:
              type: integer
              example: 5
            duration_minutes:
              type: integer
              default: 10
            levels:
              type: integer
              default: 1
    responses:
      200:
        description: Koszt treningu
    """
    data = request.get_json() or {}
    duration = int(data.get('duration_minutes', 10))
    levels = int(data.get('levels', 1))
    from app.modules.poke_training.controller import PokemonController
    total_duration = duration * levels
    cost = total_duration * PokemonController.COST_PER_MINUTE
    return jsonify({
        "cost": cost,
        "total_minutes": total_duration,
        "levels": levels
    }), 200

@pokemon_bp.route('/<int:pokemon_id>', methods=['GET'])
@jwt_required()
def get_pokemon(pokemon_id):
    """
    Zwraca szczegóły wybranego Pokémona.
    ---
    tags:
      - Pokémon
    security:
      - Bearer: []
    parameters:
      - in: header
        name: Authorization
        required: true
        type: string
        description: Token JWT (w formacie Bearer <twój_token>)
      - in: path
        name: pokemon_id
        type: integer
        required: true
        description: ID pokemona
    responses:
      200:
        description: Szczegóły pokemona
      404:
        description: Pokemon not found
    """
    pokemon = Pokemon.get_by_id(pokemon_id)
    if not pokemon:
        return jsonify({"error": "Pokemon not found"}), 404
    if pokemon.owner_id != current_user.id:
        return jsonify({"error": "You do not have permission to view this Pokemon"}), 403

    return jsonify(pokemon.to_dict()), 200


@pokemon_bp.route('/change_move', methods=['POST'])
@jwt_required()
def change_pokemon_move():
    """
    Pozwala wymienić ruch Pokémona na inny, jeśli jest dostępny na jego poziomie.
    ---
    tags:
      - Pokémon
    security:
      - Bearer: []
    consumes:
      - application/json
    parameters:
      - in: header
        name: Authorization
        required: true
        type: string
        description: Token JWT (w formacie Bearer <twój_token>)
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            pokemon_id:
              type: integer
              example: 12
            move_to_replace:
              type: string
              example: "tackle"
            new_move:
              type: string
              example: "thunderbolt"
    responses:
      200:
        description: Ruch został pomyślnie zmieniony
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Move tackle replaced with thunderbolt!"
            moves:
              type: array
              items:
                type: string
      400:
        description: Błąd danych wejściowych
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Pokémon nie znaleziony
        schema:
          type: object
          properties:
            error:
              type: string
    """
    data = request.get_json()
    pokemon_id = data.get("pokemon_id")
    move_to_replace = data.get("move_to_replace")
    new_move = data.get("new_move")

    user_id = current_user.id
    pokemon = Pokemon.query.filter_by(id=pokemon_id, owner_id=user_id).first()
    if not pokemon:
        return jsonify({"error": "Pokemon not found"}), 404

    learnable_moves = PokemonController.get_learnable_moves(pokemon.name, pokemon.level)
    if new_move not in learnable_moves:
        return jsonify({"error": f"{new_move} is not available for {pokemon.name} at level {pokemon.level}"}), 400

    current_moves = [m["name"] if isinstance(m, dict) and "name" in m else m for m in pokemon.moves or []]
    if move_to_replace not in current_moves:
        return jsonify({"error": f"{move_to_replace} not in current moveset"}), 400

    updated_moves = [new_move if m == move_to_replace else m for m in current_moves]
    pokemon.moves = updated_moves
    db.session.commit()

    return jsonify({"message": f"Move {move_to_replace} replaced with {new_move}!", "moves": updated_moves}), 200
