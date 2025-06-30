from flask import Blueprint
from flask_jwt_extended import jwt_required, current_user
from .controller import GamblingController

gambling_bp = Blueprint('gambling',__name__)

gamblingController=GamblingController()

@gambling_bp.route('/',methods=['GET'])
@jwt_required()
def buy_pokeball():
    """
    Kup Pokeball'a i wylosuj losowego Pokémona z Generacji I
    ---
    tags:
      - Gambling
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
        description: Pokémon drawn successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "You caught bulbasaur!"
            pokemon:
              type: object
      402:
        description: Not enough Poké Dollars
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Not enough Poké Dollars"
            required:
              type: integer
              example: 150
            balance:
              type: integer
              example: 50
      400:
        description: No Pokémon drawn
        schema:
          type: object
          properties:
            message:
              type: string
              example: "No Pokémon drawn."
    
    """
    user_id = current_user.id
    result = gamblingController.buy_pokeball(user_id)
    return result

@gambling_bp.route('/greatball',methods=['GET'])
@jwt_required()
def buy_greatball():
    """
    Kup GreatBall'a i wylosuj losowego Pokémona z Generacji I
    ---
    tags:
      - Gambling
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
        description: Pokémon drawn successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "You caught bulbasaur!"
            pokemon:
              type: object
      402:
        description: Not enough Poké Dollars
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Not enough Poké Dollars"
            required:
              type: integer
              example: 150
            balance:
              type: integer
              example: 50
      # 400:
      #   description: No Pokémon drawn
      #   schema:
      #     type: object
      #     properties:
      #       message:
      #         type: string
      #         example: "No Pokémon drawn."
    
    """
    user_id = current_user.id
    result = gamblingController.buy_greatball(user_id)
    return result