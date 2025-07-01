from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
import random
from flask_jwt_extended import jwt_required, current_user
from flask_socketio import emit, join_room, leave_room, rooms, ConnectionRefusedError
from app.extensions import socketio
from flask import Flask, request
from requests import get
from app.db.models import Pokemon
import time
import json

from app.db.models import User
import random

class Player:
    def __init__(self, user_id, username, points):
        self.user_id = user_id
        self.username = username
        self.pokemon = None
        self.ready = False
        self.room_id = None
        self.selected_pokemon = None
        self.next_action = None
        self.points = points  # Points for matchmaking, can be used for ranking

    def set_pokemon(self, pokemon):
        self.pokemon = pokemon

    def set_ready(self, ready):
        self.ready = ready

    def set_room_id(self, room_id):
        self.room_id = room_id

    def select_pokemon(self, pokemon):
        self.selected_pokemon = pokemon


# TODO: replace with redis or a database for production use
# waiting_players: {session_id: Player}
waiting_players = {}
# active_players: {session_id: Player}
active_players = {}

@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)

@socketio.on('connect')
def test_connect(auth):
    validation = get(request.url_root + 'api/v1/auth/login', headers={"Authorization" : f"Bearer {auth['token']}"})
    if validation.status_code == 200:
        print('Client connected:', validation.json())
        emit('auth_success', {'data': 'Connected successfully!'})
    else:
        print('Connection failed:', validation.json())
        raise ConnectionRefusedError('auth_fail')

@socketio.on('disconnect')
def test_disconnect(reason):
    print('Client disconnected, reason:', reason)
    # Clean up player from queues when they disconnect
    userID = request.sid
    
    # Check if player is in active games
    if userID in active_players:
        player = active_players[userID]
        room_id = player.room_id
        leave_room(room_id)
        print(f'User {player.username} ({userID}) left room {room_id}')
        
        # Find and notify opponent
        opponent_session_id, opponent_player = find_opponent_in_room(userID, room_id)
        if opponent_player:
            emit('opponent_left', {
                'message': f'Player {player.username} has left the game'
            }, to=opponent_session_id)
        
        # Remove player from active games
        active_players.pop(userID, None)
        active_players.pop(opponent_session_id, None)
        print(f'Removed {player.username} ({userID}) from active queue')
    
    # Remove from waiting queue if present
    if userID in waiting_players:
        player = waiting_players.pop(userID)
        print(f'Removed {player.username} ({userID}) from waiting queue')

@socketio.on('join_queue')
@jwt_required()  # jeśli korzystasz z JWT
def join_queue(data):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return

    points = user.points 
    username = data.get('username')
    points = data.get('points', 0)  
    userID = request.sid

    if not username:
        emit('error', {'message': 'Username is required'})
        return

    if userID in waiting_players or userID in active_players:
        emit('error', {'message': 'Already in queue or game'})
        return


    player = Player(userID, username, points)
    waiting_players[userID] = player

    opponent_session_id, opponent_player = find_opponent(userID)
    if opponent_player:

        room_id = opponent_player.room_id or generate_room_id()
        player.set_room_id(room_id)
        opponent_player.set_room_id(room_id)


        active_players[userID] = player
        active_players[opponent_session_id] = opponent_player


        join_room(room_id)


        waiting_players.pop(userID, None)
        waiting_players.pop(opponent_session_id, None)

        emit('match_found', {
            'room_id': room_id,
            'players': [
                {'session_id': userID, 'username': username, 'points': points},
                {'session_id': opponent_session_id, 'username': opponent_player.username, 'points': opponent_player.points}
            ],
            'message': 'Match found! Get ready to battle!'
        }, to=room_id)

        match_setup(room_id, opponent_session_id, userID)
    else:
        room_id = generate_room_id()
        player.set_room_id(room_id)
        join_room(room_id)
        emit('queue_status', {
            'message': f'{username} ({userID}) joined the queue, waiting for an opponent.',
            'room_id': room_id
        })

def find_opponent(userID):
    """
    Znajdź przeciwnika o jak najmniejszej różnicy punktów względem userID.
    """
    if userID not in waiting_players or len(waiting_players) <= 1:
        return None, None

    my_player = waiting_players[userID]
    min_diff = float('inf')
    best_opponent_id = None
    best_opponent = None

    for session_id, player in waiting_players.items():
        if session_id == userID:
            continue
        diff = abs(my_player.points - player.points)
        if diff < min_diff:
            min_diff = diff
            best_opponent_id = session_id
            best_opponent = player

    if best_opponent_id:
        return best_opponent_id, best_opponent

    return None, None

@socketio.on('send_text')
def send_text(data):
    userID = request.sid
    player = get_player_by_session_id(userID, active_players)
    message = data.get('message')
    username = data.get('username', 'Anonymous')
    
    if not player or not player.room_id or not message:
        emit('error', {'message': 'Room ID and message are required'})
        return
    
    room_id = player.room_id
    print(f'Sending message to room {room_id}: {message}')
    emit('receive_text', {'message': {"text" : message, "username" : username}}, to=room_id)

@socketio.on('ready')
def ready(data):
    userID = request.sid
    player = get_player_by_session_id(userID, active_players)
    pokemon = data.get('pokemons')
    
    if not player or not player.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return
    
    if not pokemon:
        emit('error', {'message': 'Pokemon selection is required to be ready'})
        return
    player.set_ready(True)
    pokemonData = []
    for poke in pokemon:
        # pokemonData.append(Pokemon.get_by_id(poke).to_dict())
        pokemon_dict = Pokemon.get_by_id(poke).to_dict()
        # Extract max HP from stats array
        hp_stat = next((stat for stat in pokemon_dict['stats'] if stat['stat']['name'] == 'hp'), None)
        pokemon_dict['max_HP'] = hp_stat['base_stat'] if hp_stat else 0
        pokemon_dict['current_HP'] = pokemon_dict['max_HP']
        # TODO: replace with actual moves from the database
        pokemon_dict['learned_moves'] = [{'damage_class':'physical', 'name' : 'scratch', 'type' : {"name":"water", "damage_relations":{"double_damage_from":[{"name":"fighting","url":"https://pokeapi.co/api/v2/type/2/"}],"double_damage_to":[],"half_damage_from":[],"half_damage_to":[{"name":"rock","url":"https://pokeapi.co/api/v2/type/6/"},{"name":"steel","url":"https://pokeapi.co/api/v2/type/9/"}],"no_damage_from":[{"name":"ghost","url":"https://pokeapi.co/api/v2/type/8/"}],"no_damage_to":[{"name":"ghost","url":"https://pokeapi.co/api/v2/type/8/"}]}}, 'power' : 40, 'accuracy' : 100, 'PP' : 10, 'maxPP' : 10}]
        pokemon_dict['fainted'] = False
        pokemonData.append(pokemon_dict)
        
    player.set_pokemon(pokemonData)
    with open('Pokemon_Arena_Flask/app/logs/pokemon.log', 'a') as f:
        print(json.dumps(player.pokemon), file=f)

    room_id = player.room_id
    print(f'Player {player.username} ({userID}) is ready')
    print(f'Player {player.username} chose pokemon: {list(map(lambda p: p.get("name"), player.pokemon))}')
    
    # Notify the room that the player is ready
    emit('player_ready', {
        'message': f'Player {player.username} is ready',
        'player_id': userID,
        'username': player.username
    }, to=room_id)
    
    # Check if both players are ready
    room_players = get_room_players(room_id)
    all_ready = len(room_players) == 2 and all(p.ready for p in room_players)
    
    if all_ready:
        # Get both players' information
        player_info = []
        for p in room_players:
            player_info.append({
                'username': p.username,
                'pokemon': list(map(lambda p: p.get("name"), p.pokemon)),
            })
        
        emit('battle_start', {
            'message': 'Both players are ready! Starting battle...',
            'players': player_info
        }, to=room_id)
        print(f'Starting battle in room {room_id} with players: {player_info}')

@socketio.on('not_ready')
def not_ready(data):
    player = get_player_by_session_id(request.sid, active_players)
    if not player or not player.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return
    player.set_ready(False)


@socketio.on('choose_pokemon')
def choose_pokemon(data):
    userID = request.sid
    player = get_player_by_session_id(userID, active_players)
    pokemon_id = data.get('pokemon_id')
    chosen_moves = data.get('chosen_moves')  # może nie być podane

    if not player or not player.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return

    if not pokemon_id:
        emit('error', {'message': 'Pokemon ID is required'})
        return
    
    # Fetch Pokemon data from the database
    pokemon = next((p for p in player.pokemon if p.get('id') == pokemon_id))
    pokemon_obj = Pokemon.get_by_id(pokemon_id)
    # print(f'Pokemon chosen: {pokemon}')
    if not pokemon:
        emit('error', {'message': 'Pokemon not found'})
        return

    available_moves = pokemon_obj.available_moves()
    available_move_names = {m['name'] for m in available_moves}

    # --- PRZYPADKI: ---
    if not chosen_moves:
        # Zwróć ruchy do wyboru dla frontendu
        emit('choose_moves', {
            'pokemon_id': pokemon_obj.id,
            'pokemon_name': pokemon_obj.name,
            'available_moves': available_moves,
            'message': f"Choose 4 moves for {pokemon_obj.name}"
        })
        return

    if len(chosen_moves) != 4:
        emit('error', {'message': 'Please select exactly 4 moves.'})
        return

    if not all(move in available_move_names for move in chosen_moves):
        emit('error', {'message': 'Some selected moves are not available for this Pokemon at its level.'})
        return

    chosen_move_dicts = [m for m in available_moves if m['name'] in chosen_moves]
    pokemon['available_moves'] = chosen_move_dicts
    player.select_pokemon(pokemon)

    print(f'Player {player.username} ({userID}) chose Pokemon: {pokemon_obj.name} with moves: {chosen_moves}')

    opponent_id, opponent = find_opponent_in_room(userID, player.room_id)
    if not opponent:
        emit('error', {'message': 'Opponent not found in the room'})
        return

    if opponent.selected_pokemon:
        # opp_pokemon = Pokemon.get_by_id(opponent.selected_pokemon['id'])
        # opp_moves = opp_pokemon.available_moves()
        # opp_chosen_moves = random.sample(opp_moves, min(4, len(opp_moves)))  
        # opp_poke_dict = opp_pokemon.to_dict()
        # opp_poke_dict['available_moves'] = opp_chosen_moves
        # opponent.select_pokemon(opp_poke_dict)

        emit('pokemon_prepared', {
            'message': f'{player.username} and {opponent.username} have chosen their Pokemon!',
            'pokemon': {
                'player1': {
                    'username': player.username,
                    'pokemon': player.selected_pokemon
                },
                'player2': {
                    'username': opponent.username,
                    'pokemon': opponent.selected_pokemon
                }
            }
        }, to=player.room_id)



@socketio.on('next_action')
def next_action(data):
    """Handle the next action in the battle"""
    userID = request.sid
    player = get_player_by_session_id(userID, active_players)
    action = data.get('action')
    action.setdefault('user_id', userID)  # Ensure user_id is set in action data
    
    if not player or not player.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return
    
    if not action:
        emit('error', {'message': 'Action is required'})
        return
    
    if player.next_action:
        emit('error', {'message': 'You have already set your next action'})
        return
    
    # Store the player's next action
    player.next_action = action
    print(f'Player {player.username} ({userID}) has set their next action: {action}')
    
    # Notify the room that the player has set their next action
    emit('action_set', {
        'message': f'Player {player.username} has set their next action',
        'username': player.username
    }, to=player.room_id)
    
    # Check if both players have set their actions
    room_players = get_room_players(player.room_id)
    all_actions_set = len(room_players) == 2 and all(p.next_action for p in room_players)
    
    if all_actions_set:
        # Proceed to handle actions
        next_round(player.room_id)
        
@socketio.on('run')
def handle_run(data):
    userID = request.sid
    player = get_player_by_session_id(userID, active_players)
    print(f'Player {player.username} ({userID}) is trying to run from the battle {data}')

    emit('battle_end', {
        'message': f'{data.get("username")} has run from the battle!',
        'winner': data.get('opponent_username')
    }, to=player.room_id)

def generate_room_id():
    import uuid
    return str(uuid.uuid4())

def find_opponent(userID):
    if userID not in waiting_players or len(waiting_players) <= 1:
        # Brak przeciwnika
        return None, None

    my_player = waiting_players[userID]
    min_diff = float('inf')
    best_opponent_id = None
    best_opponent = None

    for session_id, player in waiting_players.items():
        if session_id == userID:
            continue
        diff = abs(my_player.points - player.points)
        if diff < min_diff:
            min_diff = diff
            best_opponent_id = session_id
            best_opponent = player

    if best_opponent_id:
        # Usuwamy przeciwnika z kolejki
        waiting_players.pop(best_opponent_id)
        return best_opponent_id, best_opponent

    return None, None


    if waiting_players:
        return waiting_players.popitem()
    return None, None

def match_setup(room_id, player1_session_id, player2_session_id):
    """Setup match between two players"""
    player1 = active_players.get(player1_session_id)
    player2 = active_players.get(player2_session_id)
    
    emit('choose_pokemon', {
        'message': 'Send chosen pokemon',
        'players': [
            {'session_id': player1_session_id, 'username': player1.username if player1 else 'Unknown'},
            {'session_id': player2_session_id, 'username': player2.username if player2 else 'Unknown'}
        ]
    }, to=room_id)


# Helper functions to work with Player objects
def get_player_by_session_id(session_id, players_dict):
    """Get a Player object by session ID from either waiting_players or active_players"""
    return players_dict.get(session_id)

def get_room_players(room_id):
    """Get all players in a specific room"""
    return [player for player in active_players.values() if player.room_id == room_id]

def find_opponent_in_room(current_session_id, room_id):
    """Find the opponent player in the same room"""
    for session_id, player in active_players.items():
        if session_id != current_session_id and player.room_id == room_id:
            return session_id, player
    return None, None

def next_round(room_id):
    """Prepare for the next round in the battle"""
    print(f'Starting next round in room {room_id}')
    room_players = get_room_players(room_id)
    if len(room_players) < 2:
        print(f'Not enough players in room {room_id} to start the next round')
        emit('error', {'message': 'Not enough players to start the next round'}, to=room_id)
        return
    
    # Reset players' next actions
    actions = []
    for player in room_players:
        priority = None
        match player.next_action.get('type'):
            case 'pokemon':
                priority = 3
            case 'item':
                priority = 2
            case 'move':
                priority = 1
            case _:
                priority = 0

        actions.append((player.next_action, priority))
        player.next_action = None

    actions.sort(key=lambda x: x[1], reverse=True)  # Sort actions by priority
    try:
        handle_actions(actions)
    except InvalidAction as e:
        return
    
    # Notify players to prepare for the next round
    emit('next_round', {
        'message': 'Prepare for the next round!',
        'players': [{'username': p.username} for p in room_players],
        'game_state': {
            'room_id': room_id,
            'players': [{'username': p.username, 'pokemon': p.selected_pokemon, 'pokemon_nbr' : len(p.pokemon), 'fainted_nbr' : len(list(filter(lambda x: x['fainted'], p.pokemon)))} for p in room_players]
        }
    }, to=room_id)

def find_speed(action):
    """Find the speed of the action's Pokemon"""
    user = get_player_by_session_id(action.get('user_id'), active_players)
    if not user or not user.selected_pokemon:
        return 0
    speed = next(p.get("base_stat") for p in user.selected_pokemon['stats'] if p.get("stat").get("name") == 'speed')
    return speed

def handle_actions(actions_data):
    user = get_player_by_session_id(actions_data[0][0].get('user_id'), active_players)

    if actions_data[0][0].get('type') == actions_data[1][0].get('type') == 'move':
        actions_data.sort(key= lambda x: find_speed(x[0]), reverse=True)

    for action in actions_data:
        match action[0].get('type'):
            case 'move':
                emit('receive_text', {"message" : {"text" : handle_move(action[0]), "username" : "prof. Oak"}}, to=user.room_id)
            case 'item':
                emit('receive_text', {"message" : {"text" : handle_item(action[0]), "username" : "prof. Oak"}}, to=user.room_id)
            case 'pokemon':
                emit('receive_text', {"message" : {"text" : handle_pokemon(action[0]), "username" : "prof. Oak"}}, to=user.room_id)
            case _:
                print(f"Unknown action type: {action[0].get('type')}")

def handle_move(action):
    print(f"Handling move action: {action}")
    user = get_player_by_session_id(action.get('user_id'), active_players)
    oppponent_session_id, opponent = find_opponent_in_room(action.get('user_id'), user.room_id)

    if not user or not user.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return
    if not opponent:
        emit('error', {'message': 'Opponent not found or has no selected Pokemon'})
        return
    
    userPokemon = user.selected_pokemon
    opponentPokemon = opponent.selected_pokemon
    
    move_list = list(map(lambda p: p.get("name"), userPokemon.get('learned_moves', [])))
    move_name = action.get('move')
    print(f"User {user.username} is trying to use move: {move_name} from {move_list}")
    
    # Find the move index to update PP directly in the array
    move_index = None
    move = None
    for i, m in enumerate(userPokemon.get('learned_moves', [])):
        if m.get('name') == move_name:
            move_index = i
            move = m
            break

    if not move_name or move_name not in move_list:
        emit('InvalidAction', {'message': 'Invalid move selection'})
        raise InvalidAction('Invalid move selection')
    if move.get('PP', 0) <= 0:
        emit('InvalidAction', {'message': 'Move has no PP left'})
        raise InvalidAction('Move has no PP left')
    
    # Decrement PP directly in the Pokemon's learned_moves array
    userPokemon['learned_moves'][move_index]['PP'] -= 1
    
    accuracy = move.get('accuracy', 100)

    if accuracy < random.randint(0, 100):
        message = f"{userPokemon.get('name')} used {move_name}, but it missed!"
        return message

    crit_threshold = find_speed(action) / 2
    crit = int(random.randint(0, 255) <= crit_threshold) + 1
    level = userPokemon.get('level', 1)
    power = move.get('power', 0)
    # print(f"Calculating damage for move: {move}, class: {move.get('damage_class', {})})")
    if move.get('damage_class', {}) == 'physical':
        attack = next(p.get("base_stat") for p in userPokemon['stats'] if p.get("stat").get("name") == 'attack')
        defense = next(p.get("base_stat") for p in opponentPokemon['stats'] if p.get("stat").get("name") == 'defense')
    elif move.get('damage_class', {}) == 'special':
        attack = next(p.get("base_stat") for p in userPokemon['stats'] if p.get("stat").get("name") == 'special-attack')
        defense = next(p.get("base_stat") for p in opponentPokemon['stats'] if p.get("stat").get("name") == 'special-defense')

    move_type = move.get('type', {}).get('name')
    target_types = [t['type'].get('name') for t in opponentPokemon['types']]
    print(f"Calculating damage for move type: {move_type}, target types: {target_types}")
    print(opponentPokemon['types'])
    type_multiplier = damage_by_type(move_type, target_types)
    random_multiplier = random.uniform(217, 255) / 255

    damage = ((((((2 * level * crit / 5) + 2) * power * attack / defense) / 50) + 2)  * type_multiplier * random_multiplier)
    damage = int(damage)
    print(f"Damage calculated: {damage} (Crit: {crit}, Level: {level}, Power: {power}, Attack: {attack}, Defense: {defense}, Type Multiplier: {type_multiplier}, Random Multiplier: {random_multiplier})")
    print(f"Move {move_name} PP remaining: {userPokemon['learned_moves'][move_index]['PP']}")
    opponentPokemon['current_HP'] -= damage
    if opponentPokemon['current_HP'] <= 0:
        faint(opponentPokemon, user.user_id)

    message = ""
    if type_multiplier > 1:
        message = f"{userPokemon.get('name')} used {move_name} on {opponentPokemon.get('name')}! It's super effective! It dealt {damage} damage!"
    elif type_multiplier < 1:
        message = f"{userPokemon.get('name')} used {move_name} on {opponentPokemon.get('name')}! It's not very effective... It dealt {damage} damage!"
    else:
        message = f"{userPokemon.get('name')} used {move_name} on {opponentPokemon.get('name')}! It dealt {damage} damage!"

    return message

    
def faint(pokemon, user_id):
    """Handle fainting a Pokemon"""
    if (pokemon['current_HP'] <= 0):
        pokemon['fainted'] = True
        print(f"{pokemon['name']} has fainted!")
        emit('pokemon_fainted', {
            'message': f"{pokemon['name']} has fainted!",
            'pokemon_id': pokemon['id'],
            'player_id': user_id,
        }, to=pokemon.get('room_id'))

def handle_item(action):
    pass

def handle_pokemon(action):
    print(f"Handling pokemon selection action: {action}")
    user = get_player_by_session_id(action.get('user_id'), active_players)
    print(list(p.get('id') for p in user.pokemon))
    if not user or not user.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return
    
    if not action.get('pokemon_id') in list(p.get('id') for p in user.pokemon) or action.get('pokemon_id') == user.selected_pokemon.get('id'):
        emit('InvalidAction', {'message': 'Invalid Pokemon selection'})
        raise InvalidAction('Invalid Pokemon selection')
    
    user.select_pokemon(next((p for p in user.pokemon if p.get('id') == action.get('pokemon_id') )))
    return f"{user.username} has selected {user.selected_pokemon.get('name')} as their active Pokemon!"

def damage_by_type(move_type, target_types):
    """
    Calculate type effectiveness multiplier based on Pokemon type chart.
    
    Args:
        move_type (str): The type of the attacking move
        target_types (list): List of types of the defending Pokemon (can be 1 or 2 types)
    
    Returns:
        float: Damage multiplier (0, 0.5, 1, or 2)
    """
    # Type effectiveness chart - attacking type vs defending type
    # 2.0 = super effective, 0.5 = not very effective, 0.0 = no effect, 1.0 = normal
    type_chart = {
        'normal': {
            'fighting': 2.0, 'ghost': 0.0
        },
        'fire': {
            'fire': 0.5, 'water': 0.5, 'grass': 2.0, 'ice': 2.0, 'bug': 2.0, 'rock': 0.5, 'dragon': 0.5, 'steel': 2.0
        },
        'water': {
            'fire': 2.0, 'water': 0.5, 'grass': 0.5, 'ground': 2.0, 'rock': 2.0, 'dragon': 0.5
        },
        'grass': {
            'fire': 0.5, 'water': 2.0, 'grass': 0.5, 'poison': 0.5, 'ground': 2.0, 'flying': 0.5, 'bug': 0.5, 'rock': 2.0, 'dragon': 0.5, 'steel': 0.5
        },
        'electric': {
            'water': 2.0, 'grass': 0.5, 'electric': 0.5, 'ground': 0.0, 'flying': 2.0, 'dragon': 0.5
        },
        'ice': {
            'fire': 0.5, 'water': 0.5, 'grass': 2.0, 'ice': 0.5, 'ground': 2.0, 'flying': 2.0, 'dragon': 2.0, 'steel': 0.5
        },
        'fighting': {
            'normal': 2.0, 'ice': 2.0, 'poison': 0.5, 'flying': 0.5, 'psychic': 0.5, 'bug': 0.5, 'rock': 2.0, 'ghost': 0.0, 'dark': 2.0, 'steel': 2.0, 'fairy': 0.5
        },
        'poison': {
            'grass': 2.0, 'poison': 0.5, 'ground': 0.5, 'rock': 0.5, 'ghost': 0.5, 'steel': 0.0, 'fairy': 2.0
        },
        'ground': {
            'fire': 2.0, 'grass': 0.5, 'electric': 2.0, 'poison': 2.0, 'flying': 0.0, 'bug': 0.5, 'rock': 2.0, 'steel': 2.0
        },
        'flying': {
            'electric': 0.5, 'grass': 2.0, 'ice': 0.5, 'fighting': 2.0, 'bug': 2.0, 'rock': 0.5, 'steel': 0.5
        },
        'psychic': {
            'fighting': 2.0, 'poison': 2.0, 'psychic': 0.5, 'dark': 0.0, 'steel': 0.5
        },
        'bug': {
            'fire': 0.5, 'grass': 2.0, 'fighting': 0.5, 'poison': 0.5, 'flying': 0.5, 'psychic': 2.0, 'ghost': 0.5, 'dark': 2.0, 'steel': 0.5, 'fairy': 0.5
        },
        'rock': {
            'fire': 2.0, 'ice': 2.0, 'fighting': 0.5, 'ground': 0.5, 'flying': 2.0, 'bug': 2.0, 'steel': 0.5
        },
        'ghost': {
            'normal': 0.0, 'psychic': 2.0, 'ghost': 2.0, 'dark': 0.5
        },
        'dragon': {
            'dragon': 2.0, 'steel': 0.5, 'fairy': 0.0
        },
        'dark': {
            'fighting': 0.5, 'psychic': 2.0, 'ghost': 2.0, 'dark': 0.5, 'fairy': 0.5
        },
        'steel': {
            'fire': 0.5, 'water': 0.5, 'electric': 0.5, 'ice': 2.0, 'rock': 2.0, 'steel': 0.5, 'fairy': 2.0
        },
        'fairy': {
            'fire': 0.5, 'fighting': 2.0, 'poison': 0.5, 'dragon': 2.0, 'dark': 2.0, 'steel': 0.5
        }
    }
    
    # Start with normal effectiveness
    total_multiplier = 1.0
    
    # Get the effectiveness chart for the attacking move type
    move_effectiveness = type_chart.get(move_type.lower(), {})
    
    # Calculate multiplier for each defending type
    for target_type in target_types:
        type_multiplier = move_effectiveness.get(target_type.lower(), 1.0)
        total_multiplier *= type_multiplier
    
    return total_multiplier

class InvalidAction(Exception):
    """Custom exception for invalid actions in the battle"""
    def __init__(self, message):
        super().__init__(message)
        self.message = message