import os, sys
from dotenv import load_dotenv, dotenv_values
from flask_jwt_extended import JWTManager, create_access_token


load_dotenv()
# assume tests/ sits alongside app/
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)


import uuid
from datetime import datetime
import importlib
import pytest
from app.adapters.repositories._abstract_repo import Pagination
from app.dto.auth import PermissionScope

@pytest.fixture
def admin_token(client):
    # issue an admin‐scoped JWT for protected endpoints
    admin_uuid = str(uuid.uuid4())
    with client.application.app_context():
        return create_access_token(
            identity=admin_uuid,
            additional_claims={"scopes": [PermissionScope.ADMIN.value]}
        )


@pytest.fixture(autouse=True)
def return_dicts():
    return_single = {}
    return_all    = {}
    yield return_single, return_all
    # they’re re‑created fresh for each test

class DummyRepo:
    def __init__(self, name, return_single, return_all):
        self.name        = name
        self._single     = return_single
        self._all        = return_all
        self.saved_model = None

    def save(self, model, commit: bool = False):
        # mimic SQLAlchemy default assignment
        if not getattr(model, "uuid", None):
            model.uuid = str(uuid.uuid4())
        if not getattr(model, "created_at", None):
            model.created_at = datetime.utcnow()
        if hasattr(model, "is_deleted") and model.is_deleted is None:
            model.is_deleted = False

        self.saved_model = model

    def commit(self):
        # mimic SQLAlchemy’s commit
        pass

    def delete(self, model, commit: bool):
        # capture delete too
        self.saved_model = model

    def find_one(self, **kwargs):
        return self._single.get(self.name)

    def find_all(self, **kwargs):
        return self._all.get(self.name, [])

    def find_all_paginated(self, page: int, per_page: int, **kwargs):
        items = self._all.get(self.name, [])
        total = len(items)
        start = (page - 1) * per_page
        end   = start + per_page
        page_items = items[start:end]

        # use the real Pagination class
        return Pagination(
            items=page_items,
            total=total,
            page=page,
            per_page=per_page
        )

    def find_all_by_filters_paginated(self, filters=None, page: int = 1, per_page: int = 20, ordering=None):
        # we ignore filters/ordering in the dummy,
        # but still return a real Pagination
        return self.find_all_paginated(page, per_page)

class DummyUoW:
    """
    Context manager that hands out DummyRepo for each repo attribute.
    """
    last_instance = None

    def __init__(self, return_single, return_all):
        DummyUoW.last_instance = self
        # names must match what's used in your routes:
        self.user_repository = DummyRepo("user", return_single, return_all)
        # add more repositories here as you need them…

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def commit(self):
        # mimic SQLAlchemy’s commit
        pass

@pytest.fixture
def dummy_uow_class():
    """
    Provides the DummyUoW class so tests can grab .last_instance.
    """
    return DummyUoW

@pytest.fixture(autouse=True)
def patch_all_uows(monkeypatch, return_dicts):
    """
    Replace SqlAlchemyUnitOfWork in every routes module with our DummyUoW factory.
    """
    return_single, return_all = return_dicts

    def factory():
        return DummyUoW(return_single, return_all)

    for module_path in [
        "app.entrypoint.routes.auth.routes",
        # add any other route modules here…
    ]:
        mod = importlib.import_module(module_path)
        monkeypatch.setattr(mod, "SqlAlchemyUnitOfWork", factory)
    yield

@pytest.fixture
def app():
    """
    Create a Flask test app and register your blueprints.
    """
    from flask import Flask
    from app.entrypoint.routes.auth import auth_blueprint

    app = Flask(__name__)
    app.config["TESTING"] = True

    app.register_blueprint(auth_blueprint, url_prefix="/auth")

    app.config['JWT_SECRET_KEY'] = "super-secret-change-me"
    # accept tokens from both headers and cookies
    app.config['JWT_TOKEN_LOCATION'] = ["headers", "cookies"]
    app.config['JWT_COOKIE_SECURE']   = True     # only over HTTPS in prod
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
    app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False # TESTING
    jwt = JWTManager()
    jwt.init_app(app)

    return app

@pytest.fixture
def client(app):
    return app.test_client()
