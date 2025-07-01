from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
from flask_socketio import emit, join_room, leave_room, rooms, ConnectionRefusedError
from app.extensions import socketio
from flask import Flask, request
from requests import get
from app.db.models import Pokemon
import time
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
        pokemonData.append(pokemon_dict)
        
    player.set_pokemon(pokemonData)

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

    pokemon = Pokemon.get_by_id(pokemon_id)
    if not pokemon:
        emit('error', {'message': 'Pokemon not found'})
        return

    available_moves = pokemon.available_moves()
    available_move_names = {m['name'] for m in available_moves}

    # --- PRZYPADKI: ---
    if not chosen_moves:
        # Zwróć ruchy do wyboru dla frontendu
        emit('choose_moves', {
            'pokemon_id': pokemon.id,
            'pokemon_name': pokemon.name,
            'available_moves': available_moves,
            'message': f"Choose 4 moves for {pokemon.name}"
        })
        return

    if len(chosen_moves) != 4:
        emit('error', {'message': 'Please select exactly 4 moves.'})
        return

    if not all(move in available_move_names for move in chosen_moves):
        emit('error', {'message': 'Some selected moves are not available for this Pokemon at its level.'})
        return

    chosen_move_dicts = [m for m in available_moves if m['name'] in chosen_moves]
    p_dict = pokemon.to_dict()
    p_dict['available_moves'] = chosen_move_dicts
    player.select_pokemon(p_dict)

    print(f'Player {player.username} ({userID}) chose Pokemon: {pokemon.name} with moves: {chosen_moves}')

    opponent_id, opponent = find_opponent_in_room(userID, player.room_id)
    if not opponent:
        emit('error', {'message': 'Opponent not found in the room'})
        return

    if opponent.selected_pokemon:
        opp_pokemon = Pokemon.get_by_id(opponent.selected_pokemon['id'])
        opp_moves = opp_pokemon.available_moves()
        opp_chosen_moves = random.sample(opp_moves, min(4, len(opp_moves)))  
        opp_poke_dict = opp_pokemon.to_dict()
        opp_poke_dict['available_moves'] = opp_chosen_moves
        opponent.select_pokemon(opp_poke_dict)

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
        actions.append(player.next_action)
        player.next_action = None
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
            'players': [{'username': p.username, 'pokemon': p.selected_pokemon} for p in room_players]
        }
    }, to=room_id)

def handle_actions(actions_data):
    for action in actions_data:
        match action.get('type'):
            case 'move':
                handle_move(action)
            case 'item':
                handle_item(action)
            case 'pokemon':
                handle_pokemon(action)
            case _:
                print(f"Unknown action type: {action.get('type')}")

def handle_move(action):
    pass

def handle_item(action):
    pass

def handle_pokemon(action):
    print(action)
    user = get_player_by_session_id(action.get('user_id'), active_players)
    print(list(p.get('id') for p in user.pokemon))
    if not user or not user.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return
    
    if not action.get('pokemon_id') in list(p.get('id') for p in user.pokemon) or action.get('pokemon_id') == user.selected_pokemon.get('id'):
        emit('InvalidAction', {'message': 'Invalid Pokemon selection'})
        raise InvalidAction('Invalid Pokemon selection')
    
    user.select_pokemon(Pokemon.get_by_id(action.get('pokemon_id')).to_dict())

class InvalidAction(Exception):
    """Custom exception for invalid actions in the battle"""
    def __init__(self, message):
        super().__init__(message)
        self.message = message