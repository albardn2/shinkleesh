from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.domains.vote.domain import VoteDomain
from app.dto.vote import CastVoteRequest
from app.entrypoint.routes.vote import vote_blueprint


@vote_blueprint.route("", methods=["POST"])
@jwt_required()
def cast_vote():
    current_uuid = get_jwt_identity()
    payload = CastVoteRequest(**request.json)
    with SqlAlchemyUnitOfWork() as uow:
        vote_read = VoteDomain.cast_vote(uow=uow, payload=payload, current_user_uuid=current_uuid)
        result = vote_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200


@vote_blueprint.route("/<string:target_type>/<string:target_uuid>", methods=["DELETE"])
@jwt_required()
def remove_vote(target_type: str, target_uuid: str):
    current_uuid = get_jwt_identity()
    with SqlAlchemyUnitOfWork() as uow:
        vote_read = VoteDomain.remove_vote(
            uow=uow,
            target_type=target_type,
            target_uuid=target_uuid,
            current_user_uuid=current_uuid,
        )
        result = vote_read.model_dump(mode="json")
        uow.commit()
    return jsonify(result), 200
