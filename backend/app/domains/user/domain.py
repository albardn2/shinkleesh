from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.dto.auth import RegisterRequest, UserRead, UserUpdate, AdminUserUpdate
from app.entrypoint.routes.common.errors import BadRequestError, NotFoundError
from models.common import User as UserModel


class UserDomain:
    @staticmethod
    def create_user(uow: SqlAlchemyUnitOfWork, payload: RegisterRequest) -> UserRead:
        UserDomain._assert_unique(uow, username=payload.username, email=payload.email)

        user = UserModel(
            username=payload.username,
            email=payload.email,
            phone_number=payload.phone_number,
            language=payload.language,
        )
        user.set_password(payload.password)

        uow.user_repository.save(model=user, commit=False)
        return UserRead.from_orm(user)

    @staticmethod
    def update_user(
        uow: SqlAlchemyUnitOfWork,
        user_uuid: str,
        payload: UserUpdate,
        current_user_uuid: str,
    ) -> UserRead:
        user = uow.user_repository.find_one(uuid=user_uuid, is_deleted=False)
        if not user:
            raise NotFoundError("User not found")

        current_user = uow.user_repository.find_one(uuid=current_user_uuid, is_deleted=False)
        if not current_user:
            raise NotFoundError("Current user not found")

        is_self = current_user_uuid == user_uuid
        if not is_self and not current_user.is_admin:
            raise BadRequestError("You are not authorized to update this user")

        # Admin-only fields guard
        if isinstance(payload, AdminUserUpdate) and not current_user.is_admin:
            raise BadRequestError("You are not authorized to change admin fields")

        new_username = payload.username if payload.username != user.username else None
        new_email = payload.email if payload.email != user.email else None
        UserDomain._assert_unique(uow, username=new_username, email=new_email)

        updates = payload.model_dump(exclude_unset=True, exclude={"password"})
        user.update(**updates)

        if payload.password:
            user.set_password(payload.password)

        uow.user_repository.save(model=user, commit=False)
        return UserRead.from_orm(user)

    @staticmethod
    def delete_user(uow: SqlAlchemyUnitOfWork, user_uuid: str) -> UserRead:
        user = uow.user_repository.find_one(uuid=user_uuid, is_deleted=False)
        if not user:
            raise NotFoundError("User not found")
        user.is_deleted = True
        uow.user_repository.save(model=user, commit=False)
        return UserRead.from_orm(user)

    @staticmethod
    def _assert_unique(
        uow: SqlAlchemyUnitOfWork,
        username: str = None,
        email: str = None,
    ) -> None:
        if username and uow.user_repository.find_one(username=username):
            raise BadRequestError(f"Username {username!r} is already taken")
        if email and uow.user_repository.find_one(email=email):
            raise BadRequestError(f"Email {email!r} is already registered")
