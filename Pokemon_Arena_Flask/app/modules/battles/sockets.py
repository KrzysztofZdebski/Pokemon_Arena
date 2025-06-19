from flask_jwt_extended import jwt_required, current_user
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio
from flask import Flask, request
from requests import get

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
        emit('authSuccess', {'data': 'Connected successfully!'})
    else:
        print('Connection failed:', validation.json())
        emit('authFail', {'data': 'Connection failed!'})
        return False

@socketio.on('disconnect')
def test_disconnect(reason):
    print('Client disconnected, reason:', reason)
    # Clean up player from queues when they disconnect
    username_to_remove = None
    for username, room_id in waiting_players.items():
        if request.sid == socketio.server.get_session(request.sid).get('username'):
            username_to_remove = username
            break
    
    if username_to_remove:
        waiting_players.pop(username_to_remove, None)
        print(f'Removed {username_to_remove} from waiting queue')

@socketio.on('join_queue')
def join_queue(data):
    username = data.get('username')
    print(f'User {username} is trying to join the queue')
    print('Current waiting players:', waiting_players)
    print('Current active players:', active_players)
    
    if not username:
        emit('error', {'message': 'Username is required'})
        return
        
    if username in waiting_players:
        emit('error', {'message': 'You are already in the queue'})
        return
        
    if username in active_players:
        emit('error', {'message': 'You are already in an active game'})
        return
    
    if not waiting_players:
        # First player creates a room and waits
        room_id = generate_room_id()
        waiting_players[username] = room_id
        print(f'Player {username} created room {room_id} and is waiting')
        join_room(room_id)
        emit('queue_status', {'message': f'{username} joined the queue', 'room_id': room_id})
    else:
        # Second player joins - match found!
        opponent_username, room_id = waiting_players.popitem()
        
        # Add both players to active games
        active_players[username] = room_id
        active_players[opponent_username] = room_id
        
        # Second player joins the existing room
        join_room(room_id)
        
        print(f'Match found! {opponent_username} vs {username} in room {room_id}')
        
        # Emit to the entire room (both players should receive this)
        emit('match_found', {
            'room_id': room_id, 
            'players': [opponent_username, username],
            'message': 'Match found! Get ready to battle!'
        }, to=room_id)

def generate_room_id():
    import uuid
    return str(uuid.uuid4())