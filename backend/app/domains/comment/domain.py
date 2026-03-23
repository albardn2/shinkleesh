from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.dto.comment import CreateCommentRequest, UpdateCommentRequest, CommentRead
from app.entrypoint.routes.common.errors import BadRequestError, NotFoundError
from models.comment import Comment as CommentModel


class CommentDomain:
    @staticmethod
    def create_comment(
        uow: SqlAlchemyUnitOfWork,
        payload: CreateCommentRequest,
        current_user_uuid: str,
    ) -> CommentRead:
        # Verify the parent post exists
        post = uow.post_repository.find_one(uuid=payload.post_uuid, is_deleted=False)
        if not post:
            raise NotFoundError("Post not found")

        comment = CommentModel(
            user_uuid=current_user_uuid,
            post_uuid=payload.post_uuid,
            message=payload.message,
            lat=payload.lat,
            lng=payload.lng,
        )
        uow.comment_repository.save(model=comment, commit=False)
        return CommentRead.from_orm(comment)

    @staticmethod
    def get_comment(uow: SqlAlchemyUnitOfWork, comment_uuid: str) -> CommentRead:
        comment = uow.comment_repository.find_one(uuid=comment_uuid, is_deleted=False)
        if not comment:
            raise NotFoundError("Comment not found")
        return CommentRead.from_orm(comment)

    @staticmethod
    def update_comment(
        uow: SqlAlchemyUnitOfWork,
        comment_uuid: str,
        payload: UpdateCommentRequest,
        current_user_uuid: str,
    ) -> CommentRead:
        comment = uow.comment_repository.find_one(uuid=comment_uuid, is_deleted=False)
        if not comment:
            raise NotFoundError("Comment not found")

        if comment.user_uuid != current_user_uuid:
            raise BadRequestError("Only the comment owner can edit this comment")

        updates = payload.model_dump(exclude_unset=True)
        comment.update(**updates)

        uow.comment_repository.save(model=comment, commit=False)
        return CommentRead.from_orm(comment)

    @staticmethod
    def delete_comment(
        uow: SqlAlchemyUnitOfWork,
        comment_uuid: str,
        current_user_uuid: str,
    ) -> CommentRead:
        comment = uow.comment_repository.find_one(uuid=comment_uuid, is_deleted=False)
        if not comment:
            raise NotFoundError("Comment not found")

        is_owner = comment.user_uuid == current_user_uuid
        if not is_owner:
            current_user = uow.user_repository.find_one(uuid=current_user_uuid, is_deleted=False)
            if not current_user or not current_user.is_admin:
                raise BadRequestError("Only the comment owner or an admin can delete this comment")

        comment.is_deleted = True
        uow.comment_repository.save(model=comment, commit=False)
        return CommentRead.from_orm(comment)
