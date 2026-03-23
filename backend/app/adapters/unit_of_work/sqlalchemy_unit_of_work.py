import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.adapters.unit_of_work._abstract_unit_of_work import AbstractUnitOfWork
from app.adapters.repositories.user_repository import UserRepository
from app.adapters.repositories.post_repository import PostRepository
from app.adapters.repositories.comment_repository import CommentRepository
from app.adapters.repositories.vote_repository import VoteRepository


SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_DATABASE_URI")  # type: ignore
DEFAULT_SESSION_FACTORY = sessionmaker(autocommit=False, autoflush=True, bind=create_engine(SQLALCHEMY_DATABASE_URI))


class SqlAlchemyUnitOfWork(AbstractUnitOfWork):
    def __init__(self, session_factory=DEFAULT_SESSION_FACTORY):
        self.session_factory = session_factory

    def __enter__(self):
        self.session = self.session_factory()
        self.user_repository = UserRepository(session=self.session)
        self.post_repository = PostRepository(session=self.session)
        self.comment_repository = CommentRepository(session=self.session)
        self.vote_repository = VoteRepository(session=self.session)

        return self

    def __exit__(self, *args):
        super().__exit__(*args)
        self.session.close()

    def _commit(self):
        self.session.commit()

    def rollback(self):
        self.session.rollback()
