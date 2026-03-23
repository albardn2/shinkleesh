from app.adapters.repositories._abstract_repo import AbstractRepository
from models.comment import Comment


class CommentRepository(AbstractRepository[Comment]):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._type = Comment
