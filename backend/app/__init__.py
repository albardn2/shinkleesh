# app/__init__.py
import os
from dotenv import load_dotenv, dotenv_values
from flask import Flask
from app.config import Config
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from werkzeug.middleware.proxy_fix import ProxyFix

from app.entrypoint.routes.common.errors import register_error_handlers
from app.entrypoint.routes.auth import auth_blueprint
from app.entrypoint.routes.post import post_blueprint
from app.entrypoint.routes.comment import comment_blueprint
from app.entrypoint.routes.vote import vote_blueprint


jwt = JWTManager()
oauth_client = OAuth()
load_dotenv()


def create_app(config_object=Config):
    app = Flask(__name__)

    # Behind Caddy — trust X-Forwarded-Proto / -Host / -For so url_for(_external=True)
    # builds https:// URLs (needed for the OAuth redirect_uri Google validates).
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    # CORS(app, supports_credentials=True)
    # CORS FOR ANY ORIGIN
    CORS(app)

    # load configs from .env
    app.config.from_object(Config)
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    env_config = dotenv_values(os.path.join(BASE_DIR, "..", ".env"))
    app.config.from_mapping(env_config)
    # Process-env overrides .env — used in containerized deploys where compose env_file
    # loads values into os.environ rather than creating a .env file in the container.
    for key in (
        'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
        'FRONTEND_URL',
    ):
        if os.environ.get(key):
            app.config[key] = os.environ[key]

    app.config['JWT_SECRET_KEY'] = "super-secret-change-me"
    # accept tokens from both headers and cookies
    app.config['JWT_TOKEN_LOCATION'] = ["headers", "cookies"]
    app.config['JWT_COOKIE_SECURE'] = False     # only over HTTPS in prod
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
    app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # TESTING
    jwt.init_app(app)

    # OAuth clients (authlib)
    oauth_client.init_app(app)

    oauth_client.register(
        name='google',
        client_id=app.config.get('GOOGLE_CLIENT_ID', ''),
        client_secret=app.config.get('GOOGLE_CLIENT_SECRET', ''),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )

    # Register blueprints
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    app.register_blueprint(post_blueprint, url_prefix='/posts')
    app.register_blueprint(comment_blueprint, url_prefix='/comments')
    app.register_blueprint(vote_blueprint, url_prefix='/votes')

    register_error_handlers(app)
    return app
