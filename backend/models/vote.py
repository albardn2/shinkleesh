import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from models.base import Base


class Vote(Base):
    __tablename__ = 'vote'

    uuid = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Voter
    user_uuid = Column(String(36), ForeignKey('user.uuid'), nullable=False, index=True)
    user = relationship('User', backref='votes')

    # Target — either a post or a comment
    target_type = Column(String(10), nullable=False)   # 'post' or 'comment'
    target_uuid = Column(String(36), nullable=False, index=True)

    # Direction
    vote_type = Column(String(10), nullable=False)     # 'upvote' or 'downvote'

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # One vote per user per target
    __table_args__ = (
        UniqueConstraint('user_uuid', 'target_type', 'target_uuid', name='uq_vote_user_target'),
    )
