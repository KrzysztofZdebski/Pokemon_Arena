from flask_jwt_extended import JWTManager
from flasgger import Swagger
from flask_cors import CORS
import redis

cors = CORS()
jwt = JWTManager()
swagger = Swagger()