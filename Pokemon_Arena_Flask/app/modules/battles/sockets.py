from flask_jwt_extended import jwt_required, current_user
from flask_socketio import emit
from app.extensions import socketio
from flask import Flask, request
from requests import get

waiting_players = []
active_rooms = {}

@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)
    print('request headers:', request.headers)
    print('request url:', request.url_root + 'api/v1/auth/login')
    user = get(request.url_root + 'api/v1/auth/login', headers=request.headers)
    print(user.json())

@socketio.on('connect')
def test_connect(auth):
    print('client connected')

@socketio.on('disconnect')
def test_disconnect(reason):
    print('Client disconnected, reason:', reason)

# @socketio.on('join_queue')
# def join_queue(data):