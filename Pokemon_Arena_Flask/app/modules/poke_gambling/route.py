from flask import Blueprint
from flask_jwt_extended import jwt_required, current_user
from .controller import GamblingController

gambling_bp = Blueprint('gambling',__name__)

gamblingController=GamblingController()

@gambling_bp.route('/pokeballs',methods=['GET'])
@jwt_required()
def get_random_pokemon():
    user_id = current_user.user.id
    result = gamblingController.buy_pokeball(user_id)
    return result