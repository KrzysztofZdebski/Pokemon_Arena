from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from flasgger import swag_from
from .controller import RankingController

ranking_bp = Blueprint('ranking', __name__)
rankingController = RankingController()

@ranking_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_ranking():
    """
    Get user ranking.
    ---
    tags:
      - Ranking
    security:
      - Bearer: []
    responses:
      200:
        description: User ranking retrieved successfully
        schema:
          type: object
          properties:
            ranking:
              type: integer
              example: 1500
            level:
              type: string
              example: "Master"
      404:
        description: User not found
        schema:
          type: object
    """
    result = rankingController.get_user_ranking()
    return result

@ranking_bp.route('/mock', methods=['POST'])
@jwt_required()
def set_mock_points():
    """
    Ustawia przykładową liczbę punktów oraz pieniędzy dla zalogowanego użytkownika.
    ---
    tags:
      - Ranking
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
            points:
              type: integer
              example: 1234
            coins:
              type: integer
              example: 250
    responses:
      200:
        description: Points and coins set successfully!
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Points and coins set successfully!"
            points:
              type: integer
              example: 1234
            coins:
              type: integer
              example: 250
      404:
        description: User not found
        schema:
          type: object
          properties:
            message:
              type: string
              example: "User not found!"
    """
    data = request.get_json()
    points = data.get('points')
    coins = data.get('coins')
    return rankingController.set_user_points_and_coins(points=points, coins=coins)






    