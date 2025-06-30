import math
import random
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify, request
import requests
from app.db.models import User
from app.db.models import db
from app.db.models import Pokemon
class GamblingController:
    #Price of base pokeball = 150
    pokemonList = requests.get(f'https://pokeapi.co/api/v2/pokemon?limit=150').json()
    pokemonList_first_generation_pokeball = []
    pokemonList_first_generation_ultraball= []
    def get_level_0_moves(self, poke_data,n=4):
        unique_moves = {}
        for move_entry in poke_data.get("moves", []):
            move_name = move_entry["move"]["name"]
            for vgd in move_entry["version_group_details"]:
                if vgd["level_learned_at"] == 0:
                    if move_name not in unique_moves:
                        unique_moves[move_name] = move_entry["move"]
                        break
        all_moves = list(unique_moves.values())
        if len(all_moves) <= n:
            return all_moves
        return random.sample(all_moves, 4)

    def calucateScore(self,stats):
        score = 0
        for stat in stats:
            if stat['stat']['name'] =='hp':
                score += stat['base_stat'] * 1.5
            elif stat['stat']['name'] in ['attack', 'defense']:
                score += stat['base_stat'] * 1.2
            elif stat['stat']['name'] in ['special-attack', 'special-defense']:
                score += stat['base_stat'] * 1.1
            elif stat['stat']['name'] == 'speed':
                score += stat['base_stat'] * 1.3    
        return round(score)
    
    def getCatchProbability(self,pokemonList,k):
        if pokemonList is None:
            return []
        # k = 0.015 in pokeball
        # k = 0.015 in greatball
        weights = [math.exp(-k*pokemon['score']) for pokemon in pokemonList]
        for i,pokemon in enumerate(pokemonList):
            pokemon['weight']=weights[i]
        return pokemonList

    @jwt_required() 
    def buy_pokeball(self,user_id):
        pokeball_pirce = 150
        user = User.query.filter_by(id=user_id).first()
        if(user.coins < pokeball_pirce):
            return jsonify({
                "error": "Not enough Poké Dollars",
                "required": pokeball_pirce,
                "balance": user.coins
            }), 402
        user.coins -= pokeball_pirce
        # response = requests.get(f'https://pokeapi.co/api/v2/pokemon?limit=150')
        # data = response.json()
        if len(self.pokemonList_first_generation_pokeball)<1:
            for poke in self.pokemonList['results']:
                detailsResp = requests.get(f'https://pokeapi.co/api/v2/pokemon/{poke["name"]}')
                detailsData = detailsResp.json()
                speciesResp = requests.get(f'https://pokeapi.co/api/v2/pokemon-species/{poke["name"]}')
                speciesData = speciesResp.json()

                if speciesData['evolves_from_species'] is None and speciesData['generation']['name'] == 'generation-i':
                    self.pokemonList_first_generation_pokeball.append({
                        'poke': detailsData,
                        'score': self.calucateScore(detailsData['stats']),
                    })
            self.pokemonList_first_generation_pokeball = self.getCatchProbability(self.pokemonList_first_generation_pokeball,k=0.015)
        totalWeights = sum(poke['weight'] for poke in self.pokemonList_first_generation_pokeball)
        pick = random.random()*totalWeights
        for poke in self.pokemonList_first_generation_pokeball:
            pick -= poke['weight']

            if pick <=0:
                # user_id = get_jwt_identity()
                mv = self.get_level_0_moves(poke['poke'])
                poke_data = poke['poke']
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
                return jsonify({"message": f"You caught {poke_data['name']}!","name":poke_data['name'], "pokemon": new_pokemon.to_dict()})
        return jsonify({"message": "No Pokémon drawn."}), 400
    @jwt_required() 
    def buy_greatball(self,user_id):
        greatball_pirce = 450
        user = User.query.filter_by(id=user_id).first()
        if(user.coins < greatball_pirce):
            return jsonify({
                "error": "Not enough Poké Dollars",
                "required": greatball_pirce,
                "balance": user.coins
            }), 402
        user.coins -= greatball_pirce
        # response = requests.get(f'https://pokeapi.co/api/v2/pokemon?limit=150')
        # data = response.json()
        if len(self.pokemonList_first_generation_ultraball)<1:
            for poke in self.pokemonList['results']:
                detailsResp = requests.get(f'https://pokeapi.co/api/v2/pokemon/{poke["name"]}')
                detailsData = detailsResp.json()
                speciesResp = requests.get(f'https://pokeapi.co/api/v2/pokemon-species/{poke["name"]}')
                speciesData = speciesResp.json()

                if speciesData['evolves_from_species'] is None and speciesData['generation']['name'] == 'generation-i':
                    score =  self.calucateScore(detailsData['stats'])
                    if score >= 400:
                        self.pokemonList_first_generation_ultraball.append({
                            'poke': detailsData,
                            'score': score,
                        })
            self.pokemonList_first_generation_ultraball.sort(key=lambda x: x['score'], reverse=True)
            self.pokemonList_first_generation_ultraball = self.getCatchProbability(self.pokemonList_first_generation_ultraball,k=0.022)
        totalWeights = sum(poke['weight'] for poke in self.pokemonList_first_generation_ultraball)
        pick = random.random()*totalWeights
        for poke in self.pokemonList_first_generation_ultraball:
            pick -= poke['weight']
            if pick <=0:
                # user_id = get_jwt_identity()
                poke_data = poke['poke']
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
                return jsonify({"message": f"You caught {poke_data['name']}!","name":poke_data['name'], "pokemon": new_pokemon.to_dict()})
        return jsonify({"message": "No Pokémon drawn."}), 400