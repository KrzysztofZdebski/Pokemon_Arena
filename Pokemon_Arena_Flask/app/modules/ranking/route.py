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
@swag_from({
    'tags': ['Ranking'],
    'description': 'Ustawia przykładową liczbę punktów dla zalogowanego użytkownika.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'points': {
                        'type': 'integer',
                        'example': 1234
                    }
                },
                'required': ['points']
            }
        }
    ],
    'responses': {
        200: {
            'description': 'Points set successfully!',
            'schema': {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'points': {'type': 'integer'}
                }
            }
        },
        404: {
            'description': 'User not found'
        }
    }
})
def set_mock_points():
    """
    Ustawia przykładową liczbę punktów dla zalogowanego użytkownika.
    """
    data = request.get_json()
    points = data.get('points')
    result = rankingController.set_user_points(points)
    return result




    