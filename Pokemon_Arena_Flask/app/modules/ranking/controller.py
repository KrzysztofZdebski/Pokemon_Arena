from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from app.db.models import User
from app.db.models import db


class RankingController:

    @staticmethod #pobiranie ranikingu uzytkownika do wyświetlenia na stronie profilu
    def get_user_ranking():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user is None:
            return jsonify({'message': 'User not found!'}), 404

        ranking = user.get_ranking()
        level = RankingController.get_player_level(ranking)
        coins = user.get_coins()
        return jsonify({
            'ranking': ranking,
            'level': level,
            'coins': coins          
        }), 200
    

    @staticmethod
    def update_after_battle(winner_name, loser_name):
        winner = User.get_by_username(winner_name)
        loser = User.get_by_username(loser_name)
        if winner is None or loser is None:
            return jsonify({'message': 'User not found!'}), 404

        winner_change, loser_change = RankingController.calculate_points(
            winner.get_ranking(), loser.get_ranking()
        )
        winner.update_ranking(winner_change)
        loser.update_ranking(loser_change)

 
        coins_per_point = 10
        if winner_change > 0:
            winner.add_coins(winner_change * coins_per_point)
        if loser_change < 0:
            loser.add_coins(abs(loser_change) * coins_per_point-30)

        db.session.commit()
        print("update_after_battle called", winner_name, loser_name)
        return jsonify({
            'message': 'Ranking updated successfully!',
            'winner_new_ranking': winner.get_ranking(),
            'winner_new_coins': winner.get_coins(),           
            'loser_new_ranking': loser.get_ranking(),
            'loser_new_coins': loser.get_coins()              
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
    def calculate_points(winners_points, losers_points, result='win'):
        if result == 'draw':
            return 5, 5
        difference = winners_points - losers_points
        if difference < -100:  
            return 50, -25
        elif difference > 100: 
            return 10, -5
        else:                  
            return 30, -15

    
    @staticmethod #wstawianie mockowych danych do rankingu
    def insert_mock_ranking():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user is None:
            return jsonify({'message': 'User not found!'}), 404
        user.update_ranking(1000)
        db.session.commit()
        return jsonify({'message': 'Mock ranking inserted successfully!'}), 200
    
    @staticmethod
    def set_user_points_and_coins(points=None, coins=None):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if user is None:
            return jsonify({'message': 'User not found!'}), 404

        if points is not None:
            user.set_ranking(points)
        if coins is not None:
            user.set_coins(coins)
        db.session.commit()
        return jsonify({'message': 'Points and coins set successfully!', 'points': user.points, 'coins': user.coins}), 200

        



    



        

    










