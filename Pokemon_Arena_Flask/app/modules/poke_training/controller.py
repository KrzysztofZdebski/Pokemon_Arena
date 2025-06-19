from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from app.db.models import User,Pokemon
from app.db.models import db


class PokemonController:
    
    @staticmethod
    def start_training(pokemon_id, user_id,duration_minutes):
        pokemon=Pokemon.query.filter_by(id=pokemon_id, owner_id=user_id).first()

        if not pokemon:
            return jsonify({"error": "Pokemon not found"}), 404
        
        if pokemon.is_training:
            return jsonify({"error": "Pokemon is already in training"}), 400
        
        pokemon.is_training = True
        pokemon.training_end_time = datetime.utcnow() + timedelta(minutes=duration_minutes)
        db.session.commit()
        return jsonify({
            "message": "Training started", 
            "pokemon": pokemon.name, 
            "end_time": pokemon.training_end_time}), 200
    

    @staticmethod
    def get_pokemon_status(user_id,pokemon_id):
        pokemon=Pokemon.query.filter_by(id=pokemon_id, owner_id=user_id).first()
        if not pokemon:
            return jsonify({"error": "Pokemon not found"}), 404
        
        now= datetime.utcnow()

        if pokemon.is_training and pokemon.training_end_time and now>=pokemon.training_end_time:
            pokemon.is_training=False
            pokemon.training_end_time=None
            db.session.commit()
            return jsonify({
                "id": pokemon.id,
                "name": pokemon.name,
                "level": pokemon.level,
                "is_training": pokemon.is_training,
                "training_end_time": pokemon.training_end_time.isformat() if pokemon.training_end_time else None,
                "hp": pokemon.hp,
                "attack": pokemon.attack,
                "defense": pokemon.defense,
            }), 200

