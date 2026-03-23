from flask import Blueprint

comment_blueprint = Blueprint('comment', __name__)

from . import routes
