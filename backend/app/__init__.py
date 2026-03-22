# app/__init__.py
import os
from dotenv import load_dotenv, dotenv_values
from flask import Flask
from app.config import Config
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from app.entrypoint.routes.common.errors import register_error_handlers
from app.entrypoint.routes.auth import auth_blueprint



jwt = JWTManager()
load_dotenv()
def create_app(config_object=Config):
    app = Flask(__name__)

    # CORS(app, supports_credentials=True)
    # CORS FOR ANY ORIGIN
    CORS(app)

    # load configs from .env
    app.config.from_object(Config)
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    env_config = dotenv_values(os.path.join(BASE_DIR,"..", ".env"))
    app.config.from_mapping(env_config)

    app.config['JWT_SECRET_KEY'] = "super-secret-change-me"
    # accept tokens from both headers and cookies
    app.config['JWT_TOKEN_LOCATION'] = ["headers", "cookies"]
    app.config['JWT_COOKIE_SECURE']   = False     # only over HTTPS in prod
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
    app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False # TESTING
    jwt.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_blueprint, url_prefix='/auth')

    register_error_handlers(app)
    return app