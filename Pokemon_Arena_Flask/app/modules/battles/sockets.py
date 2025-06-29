from flask_jwt_extended import jwt_required, current_user
from flask_socketio import emit, join_room, leave_room, rooms, ConnectionRefusedError
from app.extensions import socketio
from flask import Flask, request
from requests import get
from app.db.models import Pokemon


class Player:
    def __init__(self, user_id, username):
        self.user_id = user_id
        self.username = username
        self.pokemon = None
        self.ready = False
        self.room_id = None
        self.selected_pokemon = None

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
        player = Player(userID, username)
        player.set_room_id(room_id)
        waiting_players[userID] = player
        print(f'Player {username} with ID {userID} created room {room_id} and is waiting')
        join_room(room_id)
        emit('queue_status', {'message': f'{username} with ID {userID} joined the queue', 'room_id': room_id})
    else:
        # Second player joins - match found!
        opponent_session_id, opponent_player = find_opponent()
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
        pokemonData.append(Pokemon.get_by_id(poke).to_dict())
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
    """Handle choosing a Pokemon for the battle"""
    userID = request.sid
    player = get_player_by_session_id(userID, active_players)
    pokemon_id = data.get('pokemon_id')
    print(f'Player {player.username} ({userID}) is choosing Pokemon with ID: {pokemon_id}')
    
    if not player or not player.room_id:
        emit('error', {'message': 'You are not in an active game'})
        return
    
    if not pokemon_id:
        emit('error', {'message': 'Pokemon ID is required'})
        return
    
    # Fetch Pokemon data from the database
    pokemon = Pokemon.get_by_id(pokemon_id)
    if not pokemon:
        emit('error', {'message': 'Pokemon not found'})
        return
    
    player.select_pokemon(pokemon.to_dict())
    
    print(f'Player {player.username} ({userID}) chose Pokemon: {pokemon.name}')
    
    # Notify the room about the chosen Pokemon
    emit('pokemon_chosen', {
        'message': f'{player.username} has chosen {pokemon.name}',
        'player': player.username,
        'pokemon': pokemon.to_dict()
    }, to=player.room_id)

def generate_room_id():
    import uuid
    return str(uuid.uuid4())

def find_opponent():
    """Find and return an opponent from waiting players"""
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