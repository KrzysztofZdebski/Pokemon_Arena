import math
import requests
from app.db.db import db
from app.extensions import jwt
from sqlalchemy.orm import mapped_column
import sqlalchemy as sa
from uuid import uuid4
from werkzeug.security import generate_password_hash, check_password_hash



class User(db.Model):
    __tablename__ = 'user'
    id = mapped_column(sa.String(), primary_key=True, default=lambda: str(uuid4()))
    email = mapped_column(sa.String(255), unique=True)
    username = mapped_column(sa.String(255), unique=True, nullable=True)
    password = mapped_column(sa.String(255), nullable=False) 
    points = mapped_column(sa.Integer, default=0)  
    coins=db.Column(db.Integer, default=150)  

    pokemons = db.relationship('Pokemon', back_populates='owner', cascade="all, delete-orphan")

    def get_ranking(self):
        return self.points
    
    def update_ranking(self, change):
        self.points+=change

    def set_ranking(self, points):
        self.points = points

    def get_coins(self):
        return self.coins

    def add_coins(self, amount):
        self.coins += amount

    def set_coins(self, amount):
        self.coins = amount

    def remove_coins(self, amount):
        self.coins = max(self.coins - amount, 0)

     
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    @classmethod
    def get_by_username(cls, username):
        return cls.query.filter_by(username=username).first()
    
    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return user.id
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return User.query.filter_by(id=identity).one_or_none()

class TokenBlocklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False)


class Pokemon(db.Model):
    __tablename__ = "pokemons"

    id = db.Column(db.Integer, primary_key=True)  # PokeAPI ID
    name = db.Column(db.String(100), nullable=False)

    base_experience = db.Column(db.Integer)
    height = db.Column(db.Integer)
    weight = db.Column(db.Integer)
    is_default = db.Column(db.Boolean, default=True)
    order = db.Column(db.Integer)

    abilities = db.Column(db.JSON)  
    forms = db.Column(db.JSON)
    held_items = db.Column(db.JSON)  # JSONB to store held items
    location_area_encounters = db.Column(db.String)
    moves = db.Column(db.JSON)
    past_types = db.Column(db.JSON)
    past_abilities = db.Column(db.JSON)
    sprites = db.Column(db.JSON)
    cries = db.Column(db.JSON)
    species = db.Column(db.JSON)
    stats = db.Column(db.JSON)
    types = db.Column(db.JSON)


    owner_id = db.Column(db.String(), db.ForeignKey('user.id'), nullable=True)
    owner = db.relationship("User", back_populates="pokemons")


    is_training = db.Column(db.Boolean, default=False)
    training_end_time = db.Column(db.DateTime, nullable=True)
    training_levels = db.Column(db.Integer, default=1)   

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "base_experience": self.base_experience,
            "height": self.height,
            "weight": self.weight,
            "is_default": self.is_default,
            "order": self.order,
            "abilities": self.abilities,
            "forms": self.forms,
            "held_items": self.held_items,
            "location_area_encounters": self.location_area_encounters,
            "moves": self.moves,
            "past_types": self.past_types,
            "past_abilities": self.past_abilities,
            "sprites": self.sprites,
            "cries": self.cries,
            "species": self.species,
            "stats": self.stats,
            "types": self.types,
            "is_training": self.is_training,
            "training_end_time": self.training_end_time.isoformat() if self.training_end_time else None,
            "owner_id": self.owner_id,
        }
class Pokeball(db.Model):
    __tablename__ = "pokeballs"
    id = db.Column(db.Integer, primary_key=True, nullable = False)  # PokeAPI ID
    pokeball_name = db.Column(db.String(100),nullable = False)
    generation = db.Column(db.String(100),nullable = False)
    pokemon_name = db.Column(db.String(100),nullable = False)
    score = db.Column(db.Integer)
    probabilities = db.Column(db.Float)
    price = db.Column(db.Integer, default=150)

    @staticmethod
    def add_pokeball_to_db(pokeball_name,pokemonList,totalWeight,price,generation='generation-i'):
        for pokemon in pokemonList:
            pokeball = Pokeball(
                pokeball_name = pokeball_name,
                pokemon_name = pokemon['poke']['name'],
                generation = generation,
                score = pokemon['score'],
                probabilities = pokemon['weight'] / totalWeight,
                price = price
            )
            db.session.add(pokeball)
        db.session.commit()
    @staticmethod
    def fetch_pokemon_generation_I():
        poke_resp = requests.get(f'https://pokeapi.co/api/v2/pokemon?limit=150').json()
        pokemonList =[]
        for poke in poke_resp['results']:
            detailsResp = requests.get(f'https://pokeapi.co/api/v2/pokemon/{poke["name"]}')
            detailsData = detailsResp.json()
            speciesResp = requests.get(f'https://pokeapi.co/api/v2/pokemon-species/{poke["name"]}')
            speciesData = speciesResp.json()

            if speciesData['evolves_from_species'] is None and speciesData['generation']['name'] == 'generation-i':
                pokemonList.append({
                    'poke': detailsData,
                    'score': Pokeball.calucateScore(detailsData['stats']),
                })
        k = 0.015
        pokemonList = Pokeball.getCatchProbability(pokemonList,k)
        totalWeight = sum(p['weight'] for p in pokemonList)
        return pokemonList,totalWeight
    @staticmethod
    def calucateScore(stats):
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
    @staticmethod
    def getCatchProbability(pokemonList,k):
        if pokemonList is None:
            return []
        # k = 0.015 in pokeball
        # k = 0.015 in greatball
        weights = [math.exp(-k*pokemon['score']) for pokemon in pokemonList]
        for i,pokemon in enumerate(pokemonList):
            pokemon['weight']=weights[i]
        return pokemonList
    @staticmethod
    def create_pokeball_gen_I():
        pokeball_name = 'pokeball'
        generation = 'generation-i'
        pokeball = Pokeball.query.filter_by(pokeball_name=pokeball_name,generation = generation).first()
        if pokeball:
            return f"Pokeball {pokeball_name} for {generation} already exists in the database."
        pokemonList,totalWeight = Pokeball.fetch_pokemon_generation_I()
        pokeball_price = 150
        Pokeball.add_pokeball_to_db(pokeball_name,pokemonList,totalWeight,pokeball_price)
    @staticmethod
    def create_gretball_gen_I():
        pokeball_name = 'greatball'
        generation = 'generation-i'
        pokeball = Pokeball.query.filter_by(pokeball_name=pokeball_name,generation = generation).first()
        if pokeball:
            return f"Pokeball {pokeball_name} for {generation} already exists in the database."
        pokemonList,totalWeight = Pokeball.fetch_pokemon_generation_I()
        pokemonList = [p for p in pokemonList if p['score'] >= 400]
        greatball_price = 450
        Pokeball.add_pokeball_to_db(pokeball_name,pokemonList,totalWeight,greatball_price,generation)