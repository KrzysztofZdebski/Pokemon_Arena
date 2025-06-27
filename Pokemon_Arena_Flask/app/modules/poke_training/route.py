from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user
from flasgger import swag_from
from app.modules.poke_training.controller import PokemonController

pokemon_bp = Blueprint('pokemon', __name__)
pokemoncontroller = PokemonController()

@pokemon_bp.route('/train', methods=['POST'])
@jwt_required()
@swag_from({
    'tags': ['Pokémon'],
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'pokemon_id': {'type': 'integer'},
                    'duration_minutes': {'type': 'integer', 'default': 30}
                },
                'required': ['pokemon_id']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Training started',
        },
        400: {'description': 'Invalid input data'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Not found'},
        402: {'description': 'Not enough Poké Dollars'}
    }
})
def train():
    """
    Start training a Pokémon
    ---
    """
    data = request.get_json()
    try:
        user_id = current_user.id  
        pokemon_id = int(data.get('pokemon_id'))
        duration = int(data.get('duration_minutes', 30))
    except (TypeError, ValueError, AttributeError):
        return jsonify({"error": "Invalid input data"}), 400

    return pokemoncontroller.start_training(pokemon_id, user_id, duration)

@pokemon_bp.route('/status', methods=['GET'])
@jwt_required()
@swag_from({
    'tags': ['Pokémon'],
    'parameters': [
        {
            'name': 'pokemon_id',
            'in': 'query',
            'type': 'integer',
            'required': True
        }
    ],
    'responses': {
        200: {'description': 'Status returned'},
        400: {'description': 'Invalid query parameters'},
        401: {'description': 'Unauthorized'},
        404: {'description': 'Not found'}
    }
})
def status():
    """
    Get status of a Pokémon
    ---
    """
    try:
        user_id = current_user.id  
        pokemon_id = int(request.args.get('pokemon_id'))
    except (TypeError, ValueError, AttributeError):
        return jsonify({"error": "Invalid query parameters"}), 400

    return pokemoncontroller.get_pokemon_status(user_id, pokemon_id)




