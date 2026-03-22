from app.adapters.repositories._abstract_repo import AbstractRepository
from models.post import Post


class PostRepository(AbstractRepository[Post]):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._type = Post
