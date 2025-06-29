from flask_jwt_extended import jwt_required, current_user
from flask_socketio import emit, join_room, leave_room, rooms, ConnectionRefusedError
from app.extensions import socketio
from flask import Flask, request
from requests import get


# TODO: replace with redis or a database for production use
waiting_players = {}
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
    userID_to_remove = None
    for uid, room_id in active_players.items():
        if uid == userID:
            userID_to_remove = uid
            leave_room(room_id)
            print(f'User {uid} left room {room_id}')
            for opp_uid, opp_room_id in active_players.items():
                if opp_uid != userID and opp_room_id == room_id:
                    # Notify opponent that the player has left
                    emit('opponent_left', {'message': f'Player {userID} has left the game'}, to=opp_uid)
            break
    
    if userID_to_remove:
        active_players.pop(userID_to_remove, None)
        print(f'Removed {userID_to_remove} from active queue')

    waiting_players.pop(userID, None)

@socketio.on('join_queue')
def join_queue(data):
    username = data.get('username')
    userID = request.sid
    print(f'User {username} is trying to join the queue')
    print('Current waiting players:', waiting_players)
    print('Current active players:', active_players)
    
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
        waiting_players[userID] = room_id
        print(f'Player {username} with ID {userID} created room {room_id} and is waiting')
        join_room(room_id)
        emit('queue_status', {'message': f'{username} with ID {userID} joined the queue', 'room_id': room_id})
    else:
        # Second player joins - match found!
        opponent_userID, room_id = find_opponent()
        
        # Add both players to active games
        active_players[userID] = room_id
        active_players[opponent_userID] = room_id
        
        # Second player joins the existing room
        join_room(room_id)
        
        print(f'Match found! {opponent_userID} vs {userID} in room {room_id}')
        
        # Emit to the entire room (both players should receive this)
        emit('match_found', {
            'room_id': room_id, 
            'players': [opponent_userID, userID],
            'message': 'Match found! Get ready to battle!'
        }, to=room_id)
        match_setup(room_id, opponent_userID, userID)

@socketio.on('send_text')
def send_text(data):
    room_id = active_players.get(request.sid)
    message = data.get('message')
    username = data.get('username', 'Anonymous')
    
    if not room_id or not message:
        emit('error', {'message': 'Room ID and message are required'})
        return
    
    print(f'Sending message to room {room_id}: {message}')
    emit('receive_text', {'message': {"text" : message, "username" : username}}, to=room_id)

@socketio.on('pokemon')
def choose_pokemon(data):
    room_id = active_players.get(request.sid)
    pokemon = data.get('pokemon')
    
    if not room_id or not pokemon:
        emit('error', {'message': 'Room ID and pokemon are required'})
        return
    
    print(f'Player {request.sid} chose pokemon: {pokemon}')
    
    # Emit to the room that the player has chosen a pokemon
    emit('pokemon_chosen', {
        'message': f'Player {request.sid} chose {pokemon}',
        'player_id': request.sid,
        'pokemon': pokemon
    }, to=room_id)
    
    # Here you can add logic to handle the chosen pokemon, like starting the battle

def generate_room_id():
    import uuid
    return str(uuid.uuid4())

def find_opponent():
    return waiting_players.popitem()

def match_setup(room_id, player1_id, player2_id):
    emit('choose_pokemon', {
        'message': 'Send chosen pokemon',
    }, to=room_id)
    
