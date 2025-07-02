import random
from flask_jwt_extended import jwt_required, current_user
from flask_socketio import emit, join_room, leave_room, rooms, ConnectionRefusedError
import requests
from app.extensions import socketio
from flask import Flask, request
from requests import get
from app.db.models import Pokemon, User
import time
import json


class Player:
    def __init__(self, user_id, username, points=0):
        self.user_id = user_id
        self.username = username
        self.pokemon = None
        self.ready = False
        self.room_id = None
        self.selected_pokemon = None
        self.next_action = None
        self.points = points

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
def join_queue(data):
    username = data.get('username')
    userID = request.sid
    print(f'User {username} is trying to join the queue')
    print('Current waiting players:', {sid: player.username for sid, player in waiting_players.items()})
    print('Current active players:', {sid: player.username for sid, player in active_players.items()})
    
    if not username:
        emit('error', {'message': 'Username is required'})
        return
        
    if userID in waiting_players:
        emit('error', {'message': 'You are already in the queue'})
        return
        
    if userID in active_players:
        emit('error', {'message': 'You are already in an active game'})
        return
    
    if not waiting_players:
        # First player creates a room and waits
        room_id = generate_room_id()
        player = Player(userID, username, User.get_by_username(username).get_ranking())
        player.set_room_id(room_id)
        waiting_players[userID] = player
        print(f'Player {username} with ID {userID} created room {room_id} and is waiting')
        join_room(room_id)
        emit('queue_status', {'message': f'{username} with ID {userID} joined the queue', 'room_id': room_id})
    else:
        # Second player joins - match found!
        waiting_players[userID] = Player(userID, username)
        opponent_session_id, opponent_player = find_opponent(userID)
        if not opponent_session_id:
            # No suitable opponent found, add to waiting queue
            room_id = generate_room_id()
            player = Player(userID, username, User.get_by_username(username).get_ranking())
            player.set_room_id(room_id)
            waiting_players[userID] = player
            print(f'Player {username} with ID {userID} created room {room_id} and is waiting')
            join_room(room_id)
            emit('queue_status', {'message': f'{username} with ID {userID} joined the queue', 'room_id': room_id})
            return
        room_id = opponent_player.room_id
        
        # Create player object for the second player
        current_player = Player(userID, username)
        current_player.set_room_id(room_id)
        
        # Add both players to active games
        active_players[userID] = current_player
        active_players[opponent_session_id] = opponent_player
        
        # Second player joins the existing room
        join_room(room_id)
        
        print(f'Match found! {opponent_player.username} vs {username} in room {room_id}')
        
        # Emit to the entire room (both players should receive this)
        emit('match_found', {
            'room_id': room_id, 
            'players': [
                {'session_id': opponent_session_id, 'username': opponent_player.username},
                {'session_id': userID, 'username': username}
            ],
            'message': 'Match found! Get ready to battle!'
        }, to=room_id)
        match_setup(room_id, opponent_session_id, userID)

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
        # pokemon_dict['learned_moves'] = [{'damage_class':'physical', 'name' : 'scratch', 'type' : {"name":"water", "damage_relations":{"double_damage_from":[{"name":"fighting","url":"https://pokeapi.co/api/v2/type/2/"}],"double_damage_to":[],"half_damage_from":[],"half_damage_to":[{"name":"rock","url":"https://pokeapi.co/api/v2/type/6/"},{"name":"steel","url":"https://pokeapi.co/api/v2/type/9/"}],"no_damage_from":[{"name":"ghost","url":"https://pokeapi.co/api/v2/type/8/"}],"no_damage_to":[{"name":"ghost","url":"https://pokeapi.co/api/v2/type/8/"}]}}, 'power' : 40, 'accuracy' : 100, 'PP' : 10, 'maxPP' : 10}]
        pokemon_dict['learned_moves'] = get_moves(pokemon_dict['moves'])
        pokemon_dict['fainted'] = False
        pokemon_dict['status_list'] = []
        pokemon_dict['block_move'] = False  # Used to block moves during a round
        pokemonData.append(pokemon_dict)
        
    player.set_pokemon(pokemonData)
    # with open('Pokemon_Arena_Flask/app/logs/pokemon.log', 'a') as f:
    #     print(json.dumps(player.pokemon), file=f)

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
    # if userID not in waiting_players or len(waiting_players) <= 1:
    #     # Brak przeciwnika
    #     return None, None

    my_player = get_player_by_session_id(userID, waiting_players)
    min_diff = float('inf')
    best_opponent_id = None
    best_opponent = None

    for session_id, player in waiting_players.items():
        player = get_player_by_session_id(session_id, waiting_players)
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
        for player in room_players:
            handleStatusEffects(player) 
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
    speed = next(p.get("base_stat") for p in user.selected_pokemon['stats'] if p.get("stat").get("name") == 'speed') * (user.selected_pokemon.get('speed_modifier', 1) if user.selected_pokemon.get('speed_modifier') else 1)
    print(f"Speed for {user.username}'s Pokemon: {speed}, modifier: {user.selected_pokemon.get('speed_modifier')}")
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
    print(f"Calculating damage for move: {move.get('name')}, class: {move.get('damage_class', {}).get('name')})")

    crit_threshold = find_speed(action) / 2
    crit = int(random.randint(0, 255) <= crit_threshold) + 1
    level = userPokemon.get('level', 1)
    power = move.get('power', 0)
    # print(move)
    # print(power)
    if move.get('damage_class', {}).get('name') == 'physical':
        attack = next(p.get("base_stat") for p in userPokemon['stats'] if p.get("stat").get("name") == 'attack') * (userPokemon.get('attack_modifier') if userPokemon.get('attack_modifier') else 1)
        defense = next(p.get("base_stat") for p in opponentPokemon['stats'] if p.get("stat").get("name") == 'defense') * (userPokemon.get('defense_modifier') if userPokemon.get('defense_modifier') else 1)
    elif move.get('damage_class', {}).get('name') == 'special':
        attack = next(p.get("base_stat") for p in userPokemon['stats'] if p.get("stat").get("name") == 'special-attack')
        defense = next(p.get("base_stat") for p in opponentPokemon['stats'] if p.get("stat").get("name") == 'special-defense')
    else: # Should only happen for class == 'status' but better be safe
        print(f"Using move with no damage, class: {move.get('damage_class', {}).get('name')}")
        message = handleStatusMove(move, userPokemon, opponentPokemon)
        return message
    
    messages = []
    accuracy = move.get('accuracy', 100)
    checkAcc = True
    if accuracy is None:
        checkAcc = False
    print(f"Move accuracy: {accuracy}, Crit threshold: {crit_threshold}, Crit: {crit}")

    if checkAcc and accuracy < random.randint(0, 100):
        message = f"{userPokemon.get('name')} used {move_name}, but it missed!"
        return message

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
        faint(opponentPokemon, find_opponent_in_room(user.user_id, user.room_id)[1])

    if type_multiplier > 1:
        messages.append(f"{userPokemon.get('name')} used {move_name} on {opponentPokemon.get('name')}! It's super effective! It dealt {damage} damage!")
    elif type_multiplier < 1:
        messages.append(f"{userPokemon.get('name')} used {move_name} on {opponentPokemon.get('name')}! It's not very effective... It dealt {damage} damage!")
    else:
        messages.append(f"{userPokemon.get('name')} used {move_name} on {opponentPokemon.get('name')}! It dealt {damage} damage!")
    messages.append(apply_status_effects(move, opponentPokemon))

    return " ".join(messages)

    
def faint(pokemon, player):
    """Handle fainting a Pokemon"""
    if (pokemon['current_HP'] <= 0):
        pokemon['fainted'] = True
        print(f"{pokemon['name']} has fainted!")
        emit('pokemon_fainted', {
            'message': f"{pokemon['name']} has fainted!",
            'pokemon_id': pokemon['id'],
            'player': player.username,
        }, to=player.room_id)
        player.select_pokemon(None)
    if len(list(filter(lambda x: not x['fainted'], player.pokemon))) == 0:
        emit('battle_end', {
            'message': f"{player.username} has no more Pokemon left! {player.username} has lost the battle!",
            'winner': find_opponent_in_room(player.user_id, player.room_id)[1].username
        }, to=player.room_id)
        active_players.pop(player.user_id, None)
        active_players.pop(find_opponent_in_room(player.user_id, player.room_id)[0], None)

def handle_item(action):
    pass

def handle_pokemon(action):
    print(f"Handling pokemon selection action: {action}")
    user = get_player_by_session_id(action.get('user_id'), active_players)
    print(list(p.get('id') for p in user.pokemon))
    if not user or not user.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return
    curr_id = user.selected_pokemon.get('id') if user.selected_pokemon else None

    if not action.get('pokemon_id') in list(p.get('id') for p in user.pokemon) or action.get('pokemon_id') == curr_id:
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

def get_moves(moves):
    """Extract moves from the Pokemon's moves list"""
    learned_moves = []
    for move in moves:
        move_url = move['url']
        response = requests.get(move_url)
        move_arr = response.json()
        move_arr['maxPP'] = move_arr['pp']
        move_arr['PP'] = move_arr['pp']
        learned_moves.append(move_arr)
    # print(f"Learned moves: {learned_moves}")
    return learned_moves

def handleStatusMove(move, userPokemon, opponentPokemon):
    """Handle status moves that affect stats, conditions, etc."""
    move_name = move.get('name', 'Unknown Move')
    stat_changes = move.get('stat_changes', [])
    target = (userPokemon if move.get('target').get('name') == 'user' else opponentPokemon)
    messages = []
    
    # Handle stat changes
    if stat_changes:
        for stat_change in stat_changes:
            stat_name = stat_change['stat']['name']
            change_amount = stat_change['change']
            
            # Find the stat in the Pokemon's stats array
            for stat in target['stats']:
                if stat['stat']['name'] == stat_name:
                    # Calculate the change based on stages
                    base_value = stat['base_stat']
                    
                    # Calculate stage multiplier
                    if change_amount >= 0:
                        multiplier = (2 + change_amount) / 2
                    else:
                        multiplier = 2 / (2 + abs(change_amount))
                    
                    # Apply the change to base_stat (but don't go below 1)
                    new_value = max(1, int(base_value * multiplier))
                    stat['base_stat'] = new_value
                    
                    # Generate appropriate message based on change amount
                    if change_amount == 2:
                        intensity = "sharply"
                    elif change_amount == 1:
                        intensity = ""
                    elif change_amount >= 3:
                        intensity = "drastically"
                    else:
                        intensity = "slightly"
                    
                    direction = "raised" if change_amount > 0 else "lowered"
                    stat_display = stat_name.replace('-', ' ').title()
                    
                    if intensity:
                        message = f"{target.get('name')}'s {stat_display} was {intensity} {direction}!"
                    else:
                        message = f"{target.get('name')}'s {stat_display} was {direction}!"
                    
                    messages.append(message)
                    break
        
    
    messages.append(apply_status_effects(move, target))
    return f"{userPokemon.get('name')} used {move_name}! " + " ".join(messages)
    

def apply_status_effects(move, target):
    messages = []
    move_name = move.get('name', 'Unknown Move')
    meta = move.get('meta', {})
    effect_entries = meta.get('ailment', {})
    allowed = ['poison', 'burn', 'paralysis', 'sleep', 'confusion']

    if effect_entries:
        effect_name = effect_entries.get('name', 'Unknown effect')
        if not effect_name or effect_name == 'none' or effect_name not in allowed:
            return ""
        messages.append(f"{target.get('name')} is affected by {move_name}: {effect_name}")
        print(f"Applying status effect: {effect_name}, status_list {target['status_list']}")
        print()
        if effect_name in list(map(lambda x: x.get('name'), target['status_list'])):
            target['status_list'] = list(filter(lambda x: x['name'] != effect_name, target['status_list']))

        target['status_list'].append({
            'name': effect_name,
            'duration': effectDuration(effect_name),
        })
    return " ".join(messages) if messages else f"{target.get('name')} is unaffected by {move_name}."
    
def effectDuration(effect_name):
    if effect_name == 'poison':
        return random.randint(2, 5)
    elif effect_name == 'burn':
        return random.randint(2, 5)
    elif effect_name == 'paralysis':
        return random.randint(1, 3)
    elif effect_name == 'sleep':
        return random.randint(1, 3)
    elif effect_name == 'confusion':
        return random.randint(1, 3)
    return 1

def handleStatusEffects(player):
    """Handle status effects at the end of each round"""
    print(f"Handling status effects for player {player.username}")
    for pokemon in player.pokemon:
        pokemon['block_move'] = False  # Reset block move for the next round
        pokemon['attack_modifier'] = 1.0  # Reset attack modifier for the next round
        pokemon['speed_modifier'] = 1.0  # Reset speed modifier for the next round
        if pokemon.get('status_list'):
            print(f"Handling status list {pokemon.get('status_list')}")
            for status in pokemon['status_list']:
                print(f"Handling status: {status}")
                # Handle each status effect
                if status['name'] == 'poison':
                    if pokemon['types'] and any(t['type']['name'] == 'poison' or t['type']['name'] == 'steel' for t in pokemon['types']):
                        print(f"{pokemon.get('name')} is immune to poison due to its type!")
                        emit('receive_text', {
                            "message": {"text": f"{pokemon.get('name')} is immune to poison due to its type!", "username": "prof. Oak"}
                        }, to=player.room_id)
                    else:
                        pokemon['current_HP'] -= int(pokemon.get('max_HP', 0) / 16)
                        print(f"{pokemon.get('name')} is poisoned! DMG: {int(pokemon.get('max_HP', 0) / 16)}")
                        emit('receive_text', {
                            "message": {"text": f"{pokemon.get('name')} is poisoned! DMG: {int(pokemon.get('max_HP', 0) / 16)}", "username": "prof. Oak"}
                        }, to=player.room_id)
                elif status['name'] == 'burn':
                    if pokemon['types'] and any(t['type']['name'] == 'fire' for t in pokemon['types']):
                        print(f"{pokemon.get('name')} is immune to poison due to its type!")
                        emit('receive_text', {
                            "message": {"text": f"{pokemon.get('name')} is immune to burn due to its type!", "username": "prof. Oak"}
                        }, to=player.room_id)
                    else:
                        pokemon['current_HP'] -= int(pokemon.get('max_HP', 0) / 16)
                        pokemon['attack_modifier'] = 0.5
                        print(f"{pokemon.get('name')} is burned! DMG: {int(pokemon.get('max_HP', 0) / 16)}")
                        emit('receive_text', {
                            "message": {"text": f"{pokemon.get('name')} is burned! DMG: {int(pokemon.get('max_HP', 0) / 16)}", "username": "prof. Oak"}
                        }, to=player.room_id)
                elif status['name'] == 'paralysis':
                    if random.randint(0, 100) < 25:  # 25% chance to be unable to move
                        pokemon['block_move'] = True
                        print(f"{pokemon.get('name')} is paralyzed!")
                        emit('receive_text', {
                            "message": {"text": f"{pokemon.get('name')} is paralyzed!", "username": "prof. Oak"}
                        }, to=player.room_id)
                    pokemon['speed_modifier'] = 0.75
                elif status['name'] == 'sleep':
                    pokemon['block_move'] = True
                    print(f"{pokemon.get('name')} is asleep!")
                    emit('receive_text', {
                        "message": {"text": f"{pokemon.get('name')} is asleep!", "username": "prof. Oak"}
                    }, to=player.room_id)
                elif status['name'] == 'confusion':
                    if random.randint(0, 100) < 50:  # 50% chance to hurt itself
                        damage = int(pokemon.get('max_HP', 0) / 8)
                        pokemon['current_HP'] -= damage
                        print(f"{pokemon.get('name')} is confused and hurt itself! DMG: {damage}")
                        emit('receive_text', {
                            "message": {"text": f"{pokemon.get('name')} is confused and hurt itself! DMG: {damage}", "username": "prof. Oak"}
                        }, to=player.room_id)
                        pokemon['block_move'] = True
                # Add more status effects as needed
                
                # Decrease duration and remove if expired
                status['duration'] -= 1
                if status['duration'] <= 0:
                    pokemon['status_list'].remove(status)
                    print(f"{pokemon.get('name')} is no longer affected by {status['name']}.")


class InvalidAction(Exception):
    """Custom exception for invalid actions in the battle"""
    def __init__(self, message):
        super().__init__(message)
        self.message = message