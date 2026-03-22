import uuid
from datetime import datetime, timezone

import h3
from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from models.base import Base


class Post(Base):
    __tablename__ = 'post'

    uuid = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Author
    user_uuid = Column(String(36), ForeignKey('user.uuid'), nullable=False, index=True)
    user = relationship('User', backref='posts')

    # Content
    message = Column(Text, nullable=False)

    # Location — explicit lat/lng for convenience, PostGIS point for geo queries
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)

    # H3 spatial index (level 7 ≈ 5 km² hexagon, good for local feed radius)
    h3_l7 = Column(String(15), nullable=False, index=True)

    # YikYak-style voting (upvotes − downvotes, cached aggregate)
    vote_count = Column(Integer, default=0, nullable=False)

    # Cached comment count (denormalized for feed performance)
    comment_count = Column(Integer, default=0, nullable=False)

    # Moderation
    is_hidden = Column(Boolean, default=False, nullable=False)

    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __init__(self, **kwargs):
        # Auto-compute h3_l7 and PostGIS location from lat/lng if not provided
        lat = kwargs.get('lat')
        lng = kwargs.get('lng')
        if lat is not None and lng is not None:
            if 'h3_l7' not in kwargs:
                kwargs['h3_l7'] = h3.latlng_to_cell(lat, lng, 7)
            if 'location' not in kwargs:
                kwargs['location'] = f'SRID=4326;POINT({lng} {lat})'
        super().__init__(**kwargs)
