from app.db.db import db
from app.extensions import jwt
from sqlalchemy.orm import mapped_column
import sqlalchemy as sa
from uuid import uuid4
from werkzeug.security import generate_password_hash, check_password_hash



class User(db.Model):
    __tablename__ = 'user'
    id = mapped_column(sa.String(), primary_key=True, default=str(uuid4()))
    email = mapped_column(sa.String(255), unique=True)
    username = mapped_column(sa.String(255), unique=True, nullable=True)
    password = mapped_column(sa.String(255), nullable=False) 
    points = mapped_column(sa.Integer, default=0)  
    coins=db.Column(db.Integer, default=0)  

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
