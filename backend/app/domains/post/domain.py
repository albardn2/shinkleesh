from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.dto.post import CreatePostRequest, UpdatePostRequest, PostRead
from app.entrypoint.routes.common.errors import BadRequestError, NotFoundError
from models.post import Post as PostModel


class PostDomain:
    @staticmethod
    def create_post(
        uow: SqlAlchemyUnitOfWork,
        payload: CreatePostRequest,
        current_user_uuid: str,
    ) -> PostRead:
        post = PostModel(
            user_uuid=current_user_uuid,
            message=payload.message,
            lat=payload.lat,
            lng=payload.lng,
        )
        uow.post_repository.save(model=post, commit=False)
        return PostRead.from_orm(post)

    @staticmethod
    def get_post(uow: SqlAlchemyUnitOfWork, post_uuid: str) -> PostRead:
        post = uow.post_repository.find_one(uuid=post_uuid, is_deleted=False)
        if not post:
            raise NotFoundError("Post not found")
        return PostRead.from_orm(post)

    @staticmethod
    def update_post(
        uow: SqlAlchemyUnitOfWork,
        post_uuid: str,
        payload: UpdatePostRequest,
        current_user_uuid: str,
    ) -> PostRead:
        post = uow.post_repository.find_one(uuid=post_uuid, is_deleted=False)
        if not post:
            raise NotFoundError("Post not found")

        # Only the owner can edit
        if post.user_uuid != current_user_uuid:
            raise BadRequestError("Only the post owner can edit this post")

        updates = payload.model_dump(exclude_unset=True)
        post.update(**updates)

        uow.post_repository.save(model=post, commit=False)
        return PostRead.from_orm(post)

    @staticmethod
    def delete_post(
        uow: SqlAlchemyUnitOfWork,
        post_uuid: str,
        current_user_uuid: str,
    ) -> PostRead:
        post = uow.post_repository.find_one(uuid=post_uuid, is_deleted=False)
        if not post:
            raise NotFoundError("Post not found")

        # Owners and admins can delete
        is_owner = post.user_uuid == current_user_uuid
        if not is_owner:
            current_user = uow.user_repository.find_one(uuid=current_user_uuid, is_deleted=False)
            if not current_user or not current_user.is_admin:
                raise BadRequestError("Only the post owner or an admin can delete this post")

        post.is_deleted = True
        uow.post_repository.save(model=post, commit=False)
        return PostRead.from_orm(post)
