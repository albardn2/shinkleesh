import uuid
from datetime import datetime, timezone
from geoalchemy2 import Geometry
import bcrypt
from sqlalchemy import create_engine, Column, String, DateTime, Text, Float, JSON, select, exists, and_, case, \
    CheckConstraint, false, true, func, literal, cast
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker, validates, aliased
import uuid
from datetime import datetime
from sqlalchemy import (
    create_engine,
    Column,
    String,
    DateTime,
    Text,
    Float,
    Boolean,
    ForeignKey,
    Integer,
)
from sqlalchemy.orm import relationship
from models.base import Base

class User(Base):
    __tablename__ = 'user'

    uuid = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), nullable=False, unique=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    password = Column(String(128), nullable=False)
    email = Column(String(120), nullable=True, unique=True)
    permission_scope = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    phone_number = Column(String(256), nullable=True)
    language = Column(String(10), nullable=True)
    is_deleted = Column(Boolean, default=False)

    # Method to set password securely
    def set_password(self, plaintext_password):
        hashed_pw = bcrypt.hashpw(
            plaintext_password.encode('utf-8'),
            bcrypt.gensalt()
        )
        self.password = hashed_pw.decode('utf-8')

    # Method to verify password securely
    def verify_password(self, plaintext_password):
        return bcrypt.checkpw(
            plaintext_password.encode('utf-8'),
            self.password.encode('utf-8')
        )

    @property
    def is_admin(self):
        scopes= self.permission_scope.split(",")
        return any(scope in ["admin", "superuser"] for scope in scopes)


