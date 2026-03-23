from flask import Blueprint

vote_blueprint = Blueprint('vote', __name__)

from . import routes  # noqa: E402, F401
