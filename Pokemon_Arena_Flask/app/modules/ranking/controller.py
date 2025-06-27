from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from app.db.models import User
from app.db.models import db


class RankingController:

    @staticmethod #pobiranie ranikingu uzytkownika do wyświetlenia na stronie profilu
    # @jwt_required()
    def get_user_ranking():
        user_id= get_jwt_identity()
        user=User.query.get(user_id)

        if user is None:
            return jsonify({'message': 'User not found!'}), 404
        
        ranking = user.get_ranking()
        level = RankingController.get_player_level(ranking)
        return jsonify({
            'ranking': ranking,
            'level': level
            }), 200
    

    @staticmethod # przeliczanie rankingu użytkownika po walce
    def update_after_battle(winner_id,loser_id):
        winner_idUser = User.query.get(winner_id)
        loser_idUser = User.query.get(loser_id)
        if winner_idUser is None or loser_idUser is None:
            return jsonify({'message': 'User not found!'}), 404
        
        winn_change, loser_change = RankingController.calculate_points(
            winner_idUser.get_ranking(), loser_idUser.get_ranking()
        )
        winner_idUser.update_ranking(winn_change)
        loser_idUser.update_ranking(loser_change)
        db.session.commit()
        return jsonify({
            'message': 'Ranking updated successfully!',
            'winner_new_ranking': winner_idUser.get_ranking(),
            'looser_new_ranking': loser_idUser.get_ranking()
        }), 200


    @staticmethod # levele graczy
    def levels():
        return{
            1:{'name': 'Beginer', 'min_points': 0,'max_points': 199},
            2:{'name': 'Trainer', 'min_points': 200, 'max_points': 399},
            3:{'name': 'Challenger', 'min_points': 400, 'max_points': 699},
            4:{'name': 'Veteran ',  'min_points': 700, 'max_points': 999},
            5:{'name': 'Elite', 'min_points': 1000, 'max_points': 1499},
            6:{'name': 'Master ', 'min_points': 1500, 'max_points': 1999},
            7:{'name': 'Legendary','min_points':2000},
        }
    
    @staticmethod #przeliczanie poziomu gracza na podstawie rankingu
    def get_player_level(ranking):
        levels = RankingController.levels()
        for level in levels.values():
            if ranking >= level['min_points'] and (ranking <= level.get('max_points', float('inf'))):
                return level['name']
        return 'Unknown Level'
    
    @staticmethod #przeliczanie punktów w odniesieniu do różnicy punktowej pomiędzy graczami
    def calculate_points(winers_points, lossers_points):
        difference = winers_points - lossers_points
        if difference >200:
            return 10,-8
        elif difference > 50:
            return 15,-8
        elif difference > -100:
            return 20,-10
        else :
            return 30,-10
    
    @staticmethod #wstawianie mockowych danych do rankingu
    def insert_mock_ranking():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user is None:
            return jsonify({'message': 'User not found!'}), 404
        user.update_ranking(1000)
        db.session.commit()
        return jsonify({'message': 'Mock ranking inserted successfully!'}), 200
    



        

    










