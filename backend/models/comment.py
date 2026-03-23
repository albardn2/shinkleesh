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
    String,
    Text,
)
from sqlalchemy.orm import relationship

from models.base import Base


class Comment(Base):
    __tablename__ = 'comment'

    uuid = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Author
    user_uuid = Column(String(36), ForeignKey('user.uuid'), nullable=False, index=True)
    user = relationship('User', backref='comments')

    # Parent post
    post_uuid = Column(String(36), ForeignKey('post.uuid'), nullable=False, index=True)
    post = relationship('Post', backref='comments')

    # Content
    message = Column(Text, nullable=False)

    # Location — explicit lat/lng for convenience, PostGIS point for geo queries
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)

    # H3 spatial index (level 7 ≈ 5 km² hexagon)
    h3_l7 = Column(String(15), nullable=False, index=True)

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
        lat = kwargs.get('lat')
        lng = kwargs.get('lng')
        if lat is not None and lng is not None:
            if 'h3_l7' not in kwargs:
                kwargs['h3_l7'] = h3.latlng_to_cell(lat, lng, 7)
            if 'location' not in kwargs:
                kwargs['location'] = f'SRID=4326;POINT({lng} {lat})'
        super().__init__(**kwargs)
