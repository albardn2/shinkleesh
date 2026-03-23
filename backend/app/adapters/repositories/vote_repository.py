from app.adapters.repositories._abstract_repo import AbstractRepository
from models.vote import Vote


class VoteRepository(AbstractRepository[Vote]):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._type = Vote
