from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.domains.post.domain import PostDomain
from app.dto.post import (
    CreatePostRequest,
    UpdatePostRequest,
    PostListParams,
    PostPage,
    PostRead,
)
from app.entrypoint.routes.post import post_blueprint
from app.entrypoint.routes.common.errors import NotFoundError
from models.post import Post as PostModel


# ---------------------------------------------------------------------------
# CRUD endpoints  (all require authentication)
# ---------------------------------------------------------------------------

@post_blueprint.route("", methods=["POST"])
@jwt_required()
def create_post():
    current_uuid = get_jwt_identity()
    payload = CreatePostRequest(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        post_read = PostDomain.create_post(
            uow=uow, payload=payload, current_user_uuid=current_uuid,
        )
        result = post_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 201


@post_blueprint.route("/<string:post_uuid>", methods=["GET"])
@jwt_required()
def get_post(post_uuid: str):
    with SqlAlchemyUnitOfWork() as uow:
        post_read = PostDomain.get_post(uow=uow, post_uuid=post_uuid)
        return jsonify(post_read.model_dump(mode="json")), 200


@post_blueprint.route("/<string:post_uuid>", methods=["PUT"])
@jwt_required()
def update_post(post_uuid: str):
    current_uuid = get_jwt_identity()
    payload = UpdatePostRequest(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        post_read = PostDomain.update_post(
            uow=uow,
            post_uuid=post_uuid,
            payload=payload,
            current_user_uuid=current_uuid,
        )
        result = post_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200


@post_blueprint.route("/<string:post_uuid>", methods=["DELETE"])
@jwt_required()
def delete_post(post_uuid: str):
    current_uuid = get_jwt_identity()
    with SqlAlchemyUnitOfWork() as uow:
        post_read = PostDomain.delete_post(
            uow=uow, post_uuid=post_uuid, current_user_uuid=current_uuid,
        )
        result = post_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# List / Feed
# ---------------------------------------------------------------------------

@post_blueprint.route("", methods=["GET"])
@jwt_required()
def list_posts():
    params = PostListParams(**request.args)

    filters = [PostModel.is_deleted == False, PostModel.is_hidden == False]
    if params.h3_l7:
        filters.append(PostModel.h3_l7 == params.h3_l7)
    if params.user_uuid:
        filters.append(PostModel.user_uuid == params.user_uuid)

    with SqlAlchemyUnitOfWork() as uow:
        page_obj = uow.post_repository.find_all_by_filters_paginated(
            filters=filters,
            page=params.page,
            per_page=params.per_page,
        )
        result = PostPage(
            posts=[PostRead.from_orm(p).model_dump(mode="json") for p in page_obj.items],
            total_count=page_obj.total,
            page=page_obj.page,
            per_page=page_obj.per_page,
            pages=page_obj.pages,
        ).model_dump(mode="json")

    return jsonify(result), 200
