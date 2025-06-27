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
