from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class CreatePostRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str
    lat: float
    lng: float


class UpdatePostRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: Optional[str] = None


class PostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")
    uuid: str
    user_uuid: str
    message: str
    lat: float
    lng: float
    h3_l7: str
    vote_count: int
    comment_count: int
    is_hidden: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class PostListParams(BaseModel):
    model_config = ConfigDict(extra="forbid")
    h3_l7: Optional[str] = None
    user_uuid: Optional[str] = None
    page: int = Field(1, gt=0)
    per_page: int = Field(20, gt=0, le=100)


class FeedParams(BaseModel):
    model_config = ConfigDict(extra="forbid")
    lat: float
    lng: float
    page: int = Field(1, gt=0)
    per_page: int = Field(20, gt=0, le=100)


class PostPage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    posts: List[PostRead]
    total_count: int
    page: int
    per_page: int
    pages: int
