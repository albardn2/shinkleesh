from datetime import timedelta

from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.exceptions import Unauthorized

from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.domains.user.domain import UserDomain
from app.dto.auth import (
    AdminUserUpdate,
    LoginRequest,
    PermissionScope,
    RegisterRequest,
    TokenResponse,
    UserListParams,
    UserPage,
    UserRead,
    UserUpdate,
)
from app.entrypoint.routes.auth import auth_blueprint
from app.entrypoint.routes.common.auth import scopes_required
from app.entrypoint.routes.common.errors import NotFoundError
from models.common import User as UserModel


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

@auth_blueprint.route("/register", methods=["POST"])
def register():
    payload = RegisterRequest(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        user_read = UserDomain.create_user(uow=uow, payload=payload)
        result = user_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 201


@auth_blueprint.route("/login", methods=["POST"])
def login():
    req = LoginRequest(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        user = uow.user_repository.find_one(username=req.username_or_email, is_deleted=False)
        if not user:
            user = uow.user_repository.find_one(email=req.username_or_email, is_deleted=False)
        if not user or not user.verify_password(req.password):
            raise Unauthorized("Bad credentials")
        if user.is_banned:
            raise Unauthorized("Account is banned")

        scopes = user.permission_scope.split(",") if user.permission_scope else []
        access_token = create_access_token(
            identity=user.uuid,
            additional_claims={"scopes": scopes},
            expires_delta=timedelta(days=1),
        )
        refresh_token = create_refresh_token(
            identity=user.uuid,
            expires_delta=timedelta(days=14),
        )

    resp = jsonify(
        TokenResponse(access_token=access_token, refresh_token=refresh_token).model_dump(mode="json")
    )
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp, 200


@auth_blueprint.route("/logout", methods=["POST"])
def logout():
    resp = jsonify({"msg": "Logged out"})
    unset_jwt_cookies(resp)
    return resp, 200


# ---------------------------------------------------------------------------
# Authenticated — own profile
# ---------------------------------------------------------------------------

@auth_blueprint.route("/me", methods=["GET"])
@jwt_required()
def me():
    current_uuid = get_jwt_identity()
    with SqlAlchemyUnitOfWork() as uow:
        user = uow.user_repository.find_one(uuid=current_uuid, is_deleted=False)
        if not user:
            raise NotFoundError("User not found")
        return jsonify(UserRead.from_orm(user).model_dump(mode="json")), 200


@auth_blueprint.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    current_uuid = get_jwt_identity()
    payload = UserUpdate(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        user_read = UserDomain.update_user(
            uow=uow,
            user_uuid=current_uuid,
            payload=payload,
            current_user_uuid=current_uuid,
        )
        result = user_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

@auth_blueprint.route("/users", methods=["POST"])
@jwt_required()
@scopes_required(PermissionScope.ADMIN.value, PermissionScope.SUPER_ADMIN.value)
def admin_create_user():
    payload = RegisterRequest(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        user_read = UserDomain.create_user(uow=uow, payload=payload)
        result = user_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 201

@auth_blueprint.route("/user/<string:user_uuid>", methods=["GET"])
@jwt_required()
@scopes_required(PermissionScope.ADMIN.value, PermissionScope.SUPER_ADMIN.value, PermissionScope.MODERATOR.value)
def get_user(user_uuid: str):
    with SqlAlchemyUnitOfWork() as uow:
        user = uow.user_repository.find_one(uuid=user_uuid, is_deleted=False)
        if not user:
            raise NotFoundError("User not found")
        return jsonify(UserRead.from_orm(user).model_dump(mode="json")), 200


@auth_blueprint.route("/user/<string:user_uuid>", methods=["PUT"])
@jwt_required()
@scopes_required(PermissionScope.ADMIN.value, PermissionScope.SUPER_ADMIN.value)
def update_user(user_uuid: str):
    current_uuid = get_jwt_identity()
    payload = AdminUserUpdate(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        user_read = UserDomain.update_user(
            uow=uow,
            user_uuid=user_uuid,
            payload=payload,
            current_user_uuid=current_uuid,
        )
        result = user_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200


@auth_blueprint.route("/user/<string:user_uuid>", methods=["DELETE"])
@jwt_required()
@scopes_required(PermissionScope.ADMIN.value, PermissionScope.SUPER_ADMIN.value)
def delete_user(user_uuid: str):
    with SqlAlchemyUnitOfWork() as uow:
        user_read = UserDomain.delete_user(uow=uow, user_uuid=user_uuid)
        result = user_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200


@auth_blueprint.route("/users", methods=["GET"])
@jwt_required()
@scopes_required(PermissionScope.ADMIN.value, PermissionScope.SUPER_ADMIN.value, PermissionScope.MODERATOR.value)
def list_users():
    params = UserListParams(**request.args)

    filters = [UserModel.is_deleted == False]
    if params.uuid:
        filters.append(UserModel.uuid == params.uuid)
    if params.username:
        filters.append(UserModel.username == params.username)
    if params.email:
        filters.append(UserModel.email == params.email)
    if params.is_banned is not None:
        filters.append(UserModel.is_banned == params.is_banned)
    if params.permission_scope:
        filters.append(UserModel.permission_scope == params.permission_scope.value)

    with SqlAlchemyUnitOfWork() as uow:
        page_obj = uow.user_repository.find_all_by_filters_paginated(
            filters=filters,
            page=params.page,
            per_page=params.per_page,
        )
        result = UserPage(
            users=[UserRead.from_orm(u).model_dump(mode="json") for u in page_obj.items],
            total_count=page_obj.total,
            page=page_obj.page,
            per_page=page_obj.per_page,
            pages=page_obj.pages,
        ).model_dump(mode="json")

    return jsonify(result), 200
