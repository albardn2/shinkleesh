from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class CreateCommentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    post_uuid: str
    message: str
    lat: float
    lng: float


class UpdateCommentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: Optional[str] = None


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")
    uuid: str
    user_uuid: str
    post_uuid: str
    message: str
    lat: float
    lng: float
    h3_l7: str
    vote_count: int
    is_hidden: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class CommentListParams(BaseModel):
    model_config = ConfigDict(extra="forbid")
    post_uuid: Optional[str] = None
    h3_l7: Optional[str] = None
    user_uuid: Optional[str] = None
    page: int = Field(1, gt=0)
    per_page: int = Field(20, gt=0, le=100)


class CommentPage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    comments: List[CommentRead]
    total_count: int
    page: int
    per_page: int
    pages: int
