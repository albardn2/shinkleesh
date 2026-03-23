from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class CastVoteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    target_type: Literal["post", "comment"]
    target_uuid: str
    vote_type: Literal["upvote", "downvote"]


class VoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")
    uuid: str
    user_uuid: str
    target_type: str
    target_uuid: str
    vote_type: str
    created_at: datetime
    updated_at: datetime
