from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.dto.vote import CastVoteRequest, VoteRead
from app.entrypoint.routes.common.errors import BadRequestError, NotFoundError
from models.vote import Vote as VoteModel


class VoteDomain:
    @staticmethod
    def cast_vote(
        uow: SqlAlchemyUnitOfWork,
        payload: CastVoteRequest,
        current_user_uuid: str,
    ) -> VoteRead:
        # Verify target exists
        if payload.target_type == "post":
            target = uow.post_repository.find_one(uuid=payload.target_uuid, is_deleted=False)
            if not target:
                raise NotFoundError("Post not found")
        else:
            target = uow.comment_repository.find_one(uuid=payload.target_uuid, is_deleted=False)
            if not target:
                raise NotFoundError("Comment not found")

        existing_vote = uow.vote_repository.find_one(
            user_uuid=current_user_uuid,
            target_type=payload.target_type,
            target_uuid=payload.target_uuid,
        )

        if existing_vote:
            if existing_vote.vote_type == payload.vote_type:
                # Same vote — no-op
                return VoteRead.from_orm(existing_vote)

            # Changing vote direction: undo old, apply new (net delta = ±2)
            delta = 2 if payload.vote_type == "upvote" else -2
            existing_vote.vote_type = payload.vote_type
            uow.vote_repository.save(model=existing_vote, commit=False)
        else:
            # New vote
            delta = 1 if payload.vote_type == "upvote" else -1
            existing_vote = VoteModel(
                user_uuid=current_user_uuid,
                target_type=payload.target_type,
                target_uuid=payload.target_uuid,
                vote_type=payload.vote_type,
            )
            uow.vote_repository.save(model=existing_vote, commit=False)

        target.vote_count = (target.vote_count or 0) + delta
        if payload.target_type == "post":
            uow.post_repository.save(model=target, commit=False)
        else:
            uow.comment_repository.save(model=target, commit=False)

        return VoteRead.from_orm(existing_vote)

    @staticmethod
    def remove_vote(
        uow: SqlAlchemyUnitOfWork,
        target_type: str,
        target_uuid: str,
        current_user_uuid: str,
    ) -> VoteRead:
        if target_type not in ("post", "comment"):
            raise BadRequestError("target_type must be 'post' or 'comment'")

        vote = uow.vote_repository.find_one(
            user_uuid=current_user_uuid,
            target_type=target_type,
            target_uuid=target_uuid,
        )
        if not vote:
            raise NotFoundError("Vote not found")

        # Undo the vote's effect on the target's vote_count
        delta = -1 if vote.vote_type == "upvote" else 1
        if target_type == "post":
            target = uow.post_repository.find_one(uuid=target_uuid, is_deleted=False)
            if target:
                target.vote_count = (target.vote_count or 0) + delta
                uow.post_repository.save(model=target, commit=False)
        else:
            target = uow.comment_repository.find_one(uuid=target_uuid, is_deleted=False)
            if target:
                target.vote_count = (target.vote_count or 0) + delta
                uow.comment_repository.save(model=target, commit=False)

        uow.vote_repository.delete(model=vote, commit=False)
        return VoteRead.from_orm(vote)
