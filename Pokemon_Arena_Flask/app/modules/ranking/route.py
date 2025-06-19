from flask import Blueprint
from flask_jwt_extended import jwt_required
from .controller import RankingController

ranking_bp = Blueprint('ranking', __name__)
rankingController = RankingController()

@ranking_bp.route('/ranking', methods=['GET'])
@jwt_required()
def get_user_ranking():
    """Get user ranking.
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

@ranking_bp.route('/ranking',methods=['POST'])
@jwt_required()
def insert_mock_ranking():
    """Insert mock ranking for testing.
    ---
    tags:
      - Ranking
    responses:
      200:
        description: Mock ranking inserted successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Mock ranking inserted successfully!"
      404:
        description: User not found
        schema:
          type: object
          """
    result = rankingController.insert_mock_ranking()
    return result




    