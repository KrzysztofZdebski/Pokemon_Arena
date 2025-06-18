from flask_jwt_extended import JWTManager
from flasgger import Swagger
from flask_cors import CORS
from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins='http://localhost:3000')
cors = CORS()
jwt = JWTManager()
swagger = Swagger()