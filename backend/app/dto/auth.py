from enum import Enum
from typing import Optional, List

import pydantic
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from datetime import datetime

from app.entrypoint.routes.common.errors import BadRequestError


class PermissionScope(str, Enum):
    SUPER_ADMIN = "superuser"
    ADMIN = "admin"
    MODERATOR = "moderator"


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str
    password: str
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    language: Optional[str] = None

    @pydantic.field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        import re
        if not re.fullmatch(r"[a-zA-Z0-9_]+", v):
            raise ValueError("username may only contain letters, numbers, and underscores")
        return v
    

class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    language: Optional[str] = None
    password: Optional[str] = None
    notification_token: Optional[str] = None


class AdminUserUpdate(UserUpdate):
    """Extended update payload available to admins only."""
    permission_scope: Optional[str] = None
    is_banned: Optional[bool] = None
    ban_reason: Optional[str] = None


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username_or_email: str
    password: str


class TokenResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    access_token: str
    refresh_token: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")
    uuid: str
    username: str
    email: Optional[str]
    is_verified: bool
    karma: int
    avatar_seed: str
    phone_number: Optional[str]
    language: Optional[str]
    is_banned: bool
    permission_scope: Optional[str]
    created_at: datetime
    is_deleted: bool


class UserListParams(BaseModel):
    model_config = ConfigDict(extra="forbid")
    uuid: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    is_banned: Optional[bool] = None
    permission_scope: Optional[PermissionScope] = None
    page: int = Field(1, gt=0)
    per_page: int = Field(20, gt=0, le=100)


class UserPage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    users: List[UserRead]
    total_count: int
    page: int
    per_page: int
    pages: int
