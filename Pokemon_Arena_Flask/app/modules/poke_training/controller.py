import requests
from flask import jsonify
from datetime import datetime, timedelta
from app.db.models import User, Pokemon
from app.db.models import db

class PokemonController:
    COST_PER_MINUTE = 50  # koszt treningu za minutę

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
    def start_training(pokemon_id, user_id, duration_minutes, levels=1):
        pokemon = Pokemon.query.filter_by(id=pokemon_id, owner_id=user_id).first()
        user = User.query.filter_by(id=user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        if not pokemon:
            return jsonify({"error": "Pokemon not found"}), 404

        if pokemon.is_training:
            return jsonify({"error": "Pokemon is already in training"}), 400

        total_duration = duration_minutes * levels
        cost = total_duration * PokemonController.COST_PER_MINUTE

        if user.coins < cost:
            return jsonify({
                "error": "Not enough Poké Dollars",
                "required": cost,
                "balance": user.coins
            }), 402

        user.coins -= cost
        pokemon.is_training = True
        pokemon.training_end_time = datetime.utcnow() + timedelta(minutes=total_duration)
        pokemon.training_levels = levels  # <------
        db.session.commit()
        return jsonify({
            "message": f"Training for {levels} level(s) started",
            "pokemon": pokemon.name,
            "end_time": pokemon.training_end_time,
            "cost": cost,
            "user_coins": user.coins
        }), 200

    @staticmethod
    def get_pokemon_status(user_id, pokemon_id):
        pokemon = Pokemon.query.filter_by(id=pokemon_id, owner_id=user_id).first()
        if not pokemon:
            return jsonify({"error": "Pokemon not found"}), 404

        now = datetime.utcnow()
        if pokemon.is_training and pokemon.training_end_time and now >= pokemon.training_end_time:
            levels_up = getattr(pokemon, "training_levels", 1)
            pokemon.level += levels_up

            # Zaktualizuj wartości w pokemon.stats
            for stat in pokemon.stats:
                name = stat["stat"]["name"]
                if name in ["hp", "attack", "defense"]:
                    increase = round(stat["base_stat"] / 50) * levels_up
                    stat["base_stat"] += increase

            pokemon.is_training = False
            pokemon.training_end_time = None
            pokemon.training_levels = 1  # resetuj po zakończonym treningu
            db.session.commit()

            # Wyciąganie statystyk z JSON-a
        stat_map = {s["stat"]["name"]: s["base_stat"] for s in pokemon.stats}

        available_moves = PokemonController.get_learnable_moves(pokemon.name, pokemon.level)

        current_moves = []
        for m in (pokemon.moves or []):
            if isinstance(m, str):
                current_moves.append(m)
            elif isinstance(m, dict) and "move" in m and "name" in m["move"]:
                current_moves.append(m["move"]["name"])

        return jsonify({
            "id": pokemon.id,
            "name": pokemon.name,
            "level": pokemon.level,
            "is_training": pokemon.is_training,
            "training_end_time": pokemon.training_end_time.isoformat() if pokemon.training_end_time else None,
            "hp": stat_map.get("hp"),
            "attack": stat_map.get("attack"),
            "defense": stat_map.get("defense"),
            "available_moves": available_moves,        
            "current_moves": current_moves 
        }), 200

    @staticmethod
    def get_learnable_moves(pokemon_name, current_level):
        response = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_name.lower()}")
        if response.status_code != 200:
            return []

        data = response.json()
        learnable_moves = []

        for move in data["moves"]:
            for version_detail in move["version_group_details"]:
                if version_detail["level_learned_at"] <= current_level:
                    learnable_moves.append(move["move"]["name"])
                    break

        return learnable_moves


