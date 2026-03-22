import uuid
from datetime import datetime, timezone

import bcrypt
from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from models.base import Base


class User(Base):
    __tablename__ = 'user'

    uuid = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(120), nullable=True, unique=True)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    password = Column(String(128), nullable=False)

    # Core YikYak mechanic — reputation score
    karma = Column(Integer, default=100, nullable=False)

    # Used by the client to deterministically generate an emoji/color avatar
    avatar_seed = Column(String(64), nullable=False, default=lambda: str(uuid.uuid4()))

    # Last known location (PostGIS Point: SRID 4326 = WGS84 lat/lng)
    last_location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)

    phone_number = Column(String(20), nullable=True)
    language = Column(String(10), nullable=True)

    # Push notification token (FCM or APNS)
    notification_token = Column(String(512), nullable=True)

    # Moderation
    is_banned = Column(Boolean, default=False, nullable=False)
    ban_reason = Column(Text, nullable=True)

    # Admin / internal scopes (comma-separated, e.g. "admin,moderator")
    permission_scope = Column(String(256), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    last_active_at = Column(DateTime(timezone=True), nullable=True)

    is_deleted = Column(Boolean, default=False, nullable=False)

    def set_password(self, plaintext_password):
        hashed_pw = bcrypt.hashpw(
            plaintext_password.encode('utf-8'),
            bcrypt.gensalt()
        )
        self.password = hashed_pw.decode('utf-8')

    def verify_password(self, plaintext_password):
        return bcrypt.checkpw(
            plaintext_password.encode('utf-8'),
            self.password.encode('utf-8')
        )

    @property
    def is_admin(self):
        if not self.permission_scope:
            return False
        scopes = self.permission_scope.split(',')
        return any(scope.strip() in ('admin', 'superuser') for scope in scopes)
