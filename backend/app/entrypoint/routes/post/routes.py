import math

import h3
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.domains.post.domain import PostDomain
from app.dto.post import (
    CreatePostRequest,
    UpdatePostRequest,
    FeedParams,
    PostListParams,
    PostPage,
    PostRead,
)
from app.entrypoint.routes.post import post_blueprint
from app.entrypoint.routes.common.errors import NotFoundError
from models.post import Post as PostModel

FEED_MIN_POSTS = 20
_EARTH_RADIUS_KM = 6371.0


def _haversine_km(lat1, lng1, lat2, lng2):
    """Return the great-circle distance in km between two lat/lng points."""
    lat1, lng1, lat2, lng2 = (math.radians(v) for v in (lat1, lng1, lat2, lng2))
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return _EARTH_RADIUS_KM * 2 * math.asin(math.sqrt(a))


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

def _build_post_page(posts, page, per_page, user_lat=None, user_lng=None):
    total = len(posts)
    offset = (page - 1) * per_page
    page_posts = posts[offset:offset + per_page]
    post_reads = []
    for p in page_posts:
        pr = PostRead.from_orm(p)
        if user_lat is not None and user_lng is not None:
            pr.distance_from_user = _haversine_km(user_lat, user_lng, p.lat, p.lng)
        post_reads.append(pr)
    return PostPage(
        posts=post_reads,
        total_count=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if per_page else 0,
    )


@post_blueprint.route("/feed/new", methods=["GET"])
@jwt_required()
def new_feed():
    """Newsfeed sorted by newest. Expands to k-ring neighbours when the user's
    h3 tile has fewer than FEED_MIN_POSTS posts."""
    params = FeedParams(**request.args)
    h3_cell = h3.latlng_to_cell(params.lat, params.lng, 7)
    base_filters = [PostModel.is_deleted == False, PostModel.is_hidden == False]

    with SqlAlchemyUnitOfWork() as uow:
        main_posts = uow.post_repository._find_all_by_filters(
            filters=base_filters + [PostModel.h3_l7 == h3_cell],
            ordering=[PostModel.created_at.desc()],
        )

        kring_posts = []
        if len(main_posts) < FEED_MIN_POSTS:
            kring_cells = list(h3.grid_ring(h3_cell, 1))
            kring_posts = uow.post_repository._find_all_by_filters(
                filters=base_filters + [PostModel.h3_l7.in_(kring_cells)],
                ordering=[PostModel.created_at.desc()],
            )

        # Main tile posts first (newest), then kring posts (newest)
        all_posts = main_posts + kring_posts
        result = _build_post_page(all_posts, params.page, params.per_page, params.lat, params.lng).model_dump(mode="json")

    return jsonify(result), 200


@post_blueprint.route("/feed/hot", methods=["GET"])
@jwt_required()
def hot_feed():
    """Newsfeed sorted by hottest (votes + comments). Expands to k-ring
    neighbours when the user's h3 tile has fewer than FEED_MIN_POSTS posts."""
    params = FeedParams(**request.args)
    h3_cell = h3.latlng_to_cell(params.lat, params.lng, 7)
    base_filters = [PostModel.is_deleted == False, PostModel.is_hidden == False]

    with SqlAlchemyUnitOfWork() as uow:
        main_posts = uow.post_repository._find_all_by_filters(
            filters=base_filters + [PostModel.h3_l7 == h3_cell],
        )

        all_posts = list(main_posts)
        if len(main_posts) < FEED_MIN_POSTS:
            kring_cells = list(h3.grid_ring(h3_cell, 1))
            kring_posts = uow.post_repository._find_all_by_filters(
                filters=base_filters + [PostModel.h3_l7.in_(kring_cells)],
            )
            all_posts += kring_posts

        all_posts.sort(key=lambda p: p.vote_count + p.comment_count, reverse=True)
        result = _build_post_page(all_posts, params.page, params.per_page, params.lat, params.lng).model_dump(mode="json")

    return jsonify(result), 200


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
