import math
import random
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify, request
import requests
from app.db.models import User,Pokemon,Pokeball
from app.db.models import db
class GamblingController:
    #Price of base pokeball = 150
    forbidden_moves = ['bide','mimic','sunny-day','magic-coat',]
    def get_level_0_moves(self, poke_data,n=4):
        unique_moves = {}
        for move_entry in poke_data.get("moves", []):
            move_name = move_entry["move"]["name"]
            if move_name in self.forbidden_moves:
                continue
            for vgd in move_entry["version_group_details"]:
                if vgd["level_learned_at"] == 0:
                    if move_name not in unique_moves:
                        unique_moves[move_name] = move_entry["move"]
                        break
        all_moves = list(unique_moves.values())
        if len(all_moves) <= n:
            return all_moves
        return random.sample(all_moves, 4)

    @jwt_required() 
    def buy_pokeball(self,user_id,generation='generation-i'):
        Pokeball.create_pokeball_gen_I()
        pokeball_name = 'pokeball'
        pokeball = Pokeball.query.filter_by(pokeball_name=pokeball_name, generation=generation).all()
        if not pokeball:
            return jsonify({"error": "Pokeball not found"}), 404
        user = User.query.filter_by(id=user_id).first()
        pokeball_price = pokeball[0].price
        if(user.coins < pokeball_price):
            return jsonify({
                "error": "Not enough Poké Dollars",
                "required": pokeball_price,
                "balance": user.coins
            }), 402
        user.coins -= pokeball_price
        # response = requests.get(f'https://pokeapi.co/api/v2/pokemon?limit=150')
        # data = response.json()
        
        names = [p.pokemon_name for p in pokeball]
        probabilities = [p.probabilities for p in pokeball]
        chosen_one = random.choices(names,probabilities,k=1)[0]
        detailsResp = requests.get(f'https://pokeapi.co/api/v2/pokemon/{chosen_one}')
        poke_data = detailsResp.json()

        mv = self.get_level_0_moves(poke_data)
        new_pokemon = Pokemon(
            name=poke_data['name'],
            base_experience=poke_data.get('base_experience'),
            height=poke_data.get('height'),
            weight=poke_data.get('weight'),
            is_default=poke_data.get('is_default', True),
            order=poke_data.get('order'),
            abilities=poke_data.get('abilities'),
            forms=poke_data.get('forms'),
            held_items=poke_data.get('held_items'),
            location_area_encounters=poke_data.get('location_area_encounters'),
            moves=mv,
            past_types=poke_data.get('past_types'),
            past_abilities=poke_data.get('past_abilities'),
            sprites=poke_data.get('sprites'),
            cries=poke_data.get('cries'),
            species=poke_data.get('species'),
            stats=poke_data.get('stats'),
            types=poke_data.get('types'),
            owner_id=user_id
        )
        db.session.add(new_pokemon)
        db.session.commit()
        poke_name = poke_data['name']
        poke_name = poke_name[0].upper() + poke_name[1:]
        return jsonify({
            "message": f"You caught {poke_name}!",
            "name": poke_name, 
            "pokemon": new_pokemon.to_dict()})
    @jwt_required() 
    def buy_greatball(self,user_id,generation='generation-i'):
        Pokeball.create_gretball_gen_I()
        greatball_name = 'greatball'
        greatball = Pokeball.query.filter_by(pokeball_name=greatball_name, generation=generation).all()
        user = User.query.filter_by(id=user_id).first()
        greatball_price = greatball[0].price 
        if(user.coins < greatball_price):
            return jsonify({
                "error": "Not enough Poké Dollars",
                "required": greatball_price,
                "balance": user.coins
            }), 402
        user.coins -= greatball_price
        # response = requests.get(f'https://pokeapi.co/api/v2/pokemon?limit=150')
        # data = response.json()
        names = [p.pokemon_name for p in greatball]
        probabilities = [p.probabilities for p in greatball]
        chosen_one = random.choices(names, probabilities, k=1)[0]
        detailsResp = requests.get(f'https://pokeapi.co/api/v2/pokemon/{chosen_one}')
        poke_data = detailsResp.json()
                
        mv = self.get_level_0_moves(poke_data)
        new_pokemon = Pokemon(
            name=poke_data['name'],
            base_experience=poke_data.get('base_experience'),
            height=poke_data.get('height'),
            weight=poke_data.get('weight'),
            is_default=poke_data.get('is_default', True),
            order=poke_data.get('order'),
            abilities=poke_data.get('abilities'),
            forms=poke_data.get('forms'),
            held_items=poke_data.get('held_items'),
            location_area_encounters=poke_data.get('location_area_encounters'),
            moves= mv,
            past_types=poke_data.get('past_types'),
            past_abilities=poke_data.get('past_abilities'),
            sprites=poke_data.get('sprites'),
            cries=poke_data.get('cries'),
            species=poke_data.get('species'),
            stats=poke_data.get('stats'),
            types=poke_data.get('types'),
            owner_id=user_id
        )
        db.session.add(new_pokemon)
        db.session.commit()
        poke_name = poke_data['name']
        poke_name = poke_name[0].upper() + poke_name[1:]
        return jsonify({
            "message": f"You caught {poke_name}!",
            "name": poke_name, 
            "pokemon": new_pokemon.to_dict()})