import requests
from flask import jsonify
from datetime import datetime, timedelta
from app.db.models import User, Pokemon
from app.db.models import db

class PokemonController:
    COST_PER_MINUTE = 50  # Koszt treningu za minutę

    @staticmethod
    def fetch_base_stats(pokemon_name):
        response = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_name.lower()}")
        if response.status_code != 200:
            return None
        data = response.json()
        stats = {stat["stat"]["name"]: stat["base_stat"] for stat in data["stats"]}
        return {
            "hp": stats.get("hp", 0),
            "attack": stats.get("attack", 0),
            "defense": stats.get("defense", 0)
        }

    @staticmethod
    def start_training(pokemon_id, user_id, duration_minutes):
        pokemon = Pokemon.query.filter_by(id=pokemon_id, owner_id=user_id).first()
        user = User.query.filter_by(id=user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        if not pokemon:
            return jsonify({"error": "Pokemon not found"}), 404

        if pokemon.is_training:
            return jsonify({"error": "Pokemon is already in training"}), 400

        cost = duration_minutes * PokemonController.COST_PER_MINUTE
        if user.balance < cost:
            return jsonify({
                "error": "Not enough Poké Dollars",
                "required": cost,
                "balance": user.balance
            }), 402

        user.balance -= cost
        pokemon.is_training = True
        pokemon.training_end_time = datetime.utcnow() + timedelta(minutes=duration_minutes)
        db.session.commit()
        return jsonify({
            "message": "Training started",
            "pokemon": pokemon.name,
            "end_time": pokemon.training_end_time,
            "cost": cost,
            "user_balance": user.balance
        }), 200

    @staticmethod
    def get_pokemon_status(user_id, pokemon_id):
        pokemon = Pokemon.query.filter_by(id=pokemon_id, owner_id=user_id).first()
        if not pokemon:
            return jsonify({"error": "Pokemon not found"}), 404

        now = datetime.utcnow()
        if pokemon.is_training and pokemon.training_end_time and now >= pokemon.training_end_time:
            stat_map = {s["stat"]["name"]: s["base_stat"] for s in pokemon.stats}
            base_hp = stat_map.get("hp", 0)
            base_attack = stat_map.get("attack", 0)
            base_defense = stat_map.get("defense", 0)
            pokemon.level += 1
            pokemon.hp += round(base_hp / 50)
            pokemon.attack += round(base_attack / 50)
            pokemon.defense += round(base_defense / 50)
            pokemon.is_training = False
            pokemon.training_end_time = None
            db.session.commit()

        return jsonify({
            "id": pokemon.id,
            "name": pokemon.name,
            "level": pokemon.level,
            "is_training": pokemon.is_training,
            "training_end_time": pokemon.training_end_time.isoformat() if pokemon.training_end_time else None,
            "hp": pokemon.hp,
            "attack": pokemon.attack,
            "defense": pokemon.defense,
        }), 200
