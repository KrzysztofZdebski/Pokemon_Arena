from flask import Blueprint, make_response, jsonify, request
from flask_jwt_extended import current_user, jwt_required
from .controller import BattlesController


battles_bp = Blueprint('battles', __name__)
battles_controller = BattlesController()
@battles_bp.route('/', methods=['GET'])
def index():
    """ Example endpoint with simple greeting.
    ---
    tags:
      - Example API
    responses:
      200:
        description: A simple greeting
        schema:
          type: object
          properties:
            data:
              type: object
              properties:
                message:
                  type: string
                  example: "Hello World!"
    """
    result=battles_controller.index()
    return make_response(jsonify(data=result))

@battles_bp.route('/pokemon', methods=['GET'])
@jwt_required()
def get_pokemon():
    """ Get Pokemon for the current user.
    ---
    tags:
      - Battles
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
        required: true
        type: string
        description: The ID of the Pokemon to retrieve.
    responses:
      200:
        description: A list of Pokemon for the current user.
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                    example: "123"
                  name:
                    type: string
                    example: "Pikachu"
      400:
        description: Invalid request or user not authenticated.
      404:
        description: Pokemon not found.
    """
    result, status_code = battles_controller.get_pokemon(request, current_user)
    if status_code != 200:
        return make_response(jsonify(result), status_code)
    return make_response(jsonify(data=result), status_code)


from app.modules.battles.sockets import active_players, Player