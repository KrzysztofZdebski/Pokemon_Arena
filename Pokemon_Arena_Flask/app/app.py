from flask import Flask
from flask_cors import CORS
from app.config.config import get_config_by_name
from app.initialize_functions import initialize_route, initialize_db, initialize_swagger, initialize_blocklist_cleanup, initialize_cors, initialize_jwt, initialize_socketio
import app.modules.battles.sockets  # Importing sockets to register them with SocketIO

def create_app(config=None) -> Flask:
    """
    Create a Flask application.

    Args:
        config: The configuration object to use.

    Returns:
        A Flask application instance.
    """
    app = Flask(__name__, static_folder='../static')
    if config:
        app.config.from_object(get_config_by_name(config))

    initialize_db(app)
    initialize_route(app)
    initialize_swagger(app)
    initialize_cors(app)
    initialize_jwt(app)
    initialize_blocklist_cleanup(app)
    initialize_socketio(app)

    return app
