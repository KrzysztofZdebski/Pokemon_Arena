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
    
    def getCatchProbability(self,pokemonList):
        if pokemonList is None:
            return []
        k = 0.015
        weights = [math.exp(-k*pokemon) for pokemon in pokemonList]
        for i,pokemon in enumerate(pokemonList):
            pokemon['weight']=weights[i]
        return pokemonList

    @jwt_required() 
    @staticmethod 
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
        response = requests.get(f'https://pokeapi.co/api/v2/pokemon?limit=150')
        data = response.json()
        pokemonList = []
        for poke in data['results']:
            detailsResp = requests.get(f'https://pokeapi.co/api/v2/pokemon/{poke["name"]}')
            detailsData = detailsResp.json()
            speciesResp = requests.get(f'https://pokeapi.co/api/v2/pokemon-species/{poke.name}')
            speciesData = speciesResp.json()

            if speciesData['evolves_from_species'] is None and speciesData['generation']['name'] == 'generation-i':
                pokemonList.append({
                    'poke': detailsData,
                    'score': self.calucateScore(poke['stats']),
                })
        pokemonList = self.getCatchProbability(pokemonList)
        totalWeights = sum(poke['weight'] for poke in pokemonList)
        pick = random()*totalWeights
        for poke in pokemonList:
            pick -= poke['weight']/totalWeights
            if pick <=0:
                # user_id = get_jwt_identity()
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
                    moves=poke_data.get('moves'),
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
                return jsonify({"message": f"You caught {poke_data['name']}!", "pokemon": new_pokemon.to_dict()})
        return jsonify({"message": "No Pokémon drawn."}), 400