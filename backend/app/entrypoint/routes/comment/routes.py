from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.domains.comment.domain import CommentDomain
from app.dto.comment import (
    CreateCommentRequest,
    UpdateCommentRequest,
    CommentListParams,
    CommentPage,
    CommentRead,
)
from app.entrypoint.routes.comment import comment_blueprint
from models.comment import Comment as CommentModel


# ---------------------------------------------------------------------------
# CRUD endpoints  (all require authentication)
# ---------------------------------------------------------------------------

@comment_blueprint.route("", methods=["POST"])
@jwt_required()
def create_comment():
    current_uuid = get_jwt_identity()
    payload = CreateCommentRequest(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        comment_read = CommentDomain.create_comment(
            uow=uow, payload=payload, current_user_uuid=current_uuid,
        )
        result = comment_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 201


@comment_blueprint.route("/<string:comment_uuid>", methods=["GET"])
@jwt_required()
def get_comment(comment_uuid: str):
    with SqlAlchemyUnitOfWork() as uow:
        comment_read = CommentDomain.get_comment(uow=uow, comment_uuid=comment_uuid)
        return jsonify(comment_read.model_dump(mode="json")), 200


@comment_blueprint.route("/<string:comment_uuid>", methods=["PUT"])
@jwt_required()
def update_comment(comment_uuid: str):
    current_uuid = get_jwt_identity()
    payload = UpdateCommentRequest(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        comment_read = CommentDomain.update_comment(
            uow=uow,
            comment_uuid=comment_uuid,
            payload=payload,
            current_user_uuid=current_uuid,
        )
        result = comment_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200


@comment_blueprint.route("/<string:comment_uuid>", methods=["DELETE"])
@jwt_required()
def delete_comment(comment_uuid: str):
    current_uuid = get_jwt_identity()
    with SqlAlchemyUnitOfWork() as uow:
        comment_read = CommentDomain.delete_comment(
            uow=uow, comment_uuid=comment_uuid, current_user_uuid=current_uuid,
        )
        result = comment_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@comment_blueprint.route("", methods=["GET"])
@jwt_required()
def list_comments():
    params = CommentListParams(**request.args)

    filters = [CommentModel.is_deleted == False, CommentModel.is_hidden == False]
    if params.post_uuid:
        filters.append(CommentModel.post_uuid == params.post_uuid)
    if params.h3_l7:
        filters.append(CommentModel.h3_l7 == params.h3_l7)
    if params.user_uuid:
        filters.append(CommentModel.user_uuid == params.user_uuid)

    with SqlAlchemyUnitOfWork() as uow:
        page_obj = uow.comment_repository.find_all_by_filters_paginated(
            filters=filters,
            page=params.page,
            per_page=params.per_page,
        )
        result = CommentPage(
            comments=[CommentRead.from_orm(c).model_dump(mode="json") for c in page_obj.items],
            total_count=page_obj.total,
            page=page_obj.page,
            per_page=page_obj.per_page,
            pages=page_obj.pages,
        ).model_dump(mode="json")

    return jsonify(result), 200
