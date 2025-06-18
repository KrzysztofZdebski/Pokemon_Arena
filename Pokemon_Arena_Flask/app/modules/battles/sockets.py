from flask_socketio import emit
from app.extensions import socketio
from flask import Flask

print("test")

@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)

@socketio.on('connect')
def test_connect(auth):
    print('client connected')

@socketio.on('disconnect')
def test_disconnect(reason):
    print('Client disconnected, reason:', reason)