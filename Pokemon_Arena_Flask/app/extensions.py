from flask_jwt_extended import JWTManager
from flasgger import Swagger
from flask_cors import CORS

cors = CORS()
jwt = JWTManager()
swagger = Swagger()