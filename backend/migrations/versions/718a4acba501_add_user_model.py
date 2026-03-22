"""Add user model

Revision ID: 718a4acba501
Revises:
Create Date: 2026-03-22 12:48:17.048856

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = '718a4acba501'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('user',
    sa.Column('uuid', sa.String(length=36), nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('email', sa.String(length=120), nullable=True),
    sa.Column('is_email_verified', sa.Boolean(), nullable=False),
    sa.Column('password', sa.String(length=128), nullable=False),
    sa.Column('karma', sa.Integer(), nullable=False),
    sa.Column('avatar_seed', sa.String(length=64), nullable=False),
    sa.Column('last_location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, from_text='ST_GeomFromEWKT', name='geometry'), nullable=True),
    sa.Column('phone_number', sa.String(length=20), nullable=True),
    sa.Column('language', sa.String(length=10), nullable=True),
    sa.Column('notification_token', sa.String(length=512), nullable=True),
    sa.Column('is_banned', sa.Boolean(), nullable=False),
    sa.Column('ban_reason', sa.Text(), nullable=True),
    sa.Column('permission_scope', sa.String(length=256), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('last_active_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('uuid'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('username')
    )
    op.execute('CREATE INDEX IF NOT EXISTS idx_user_last_location ON "user" USING gist (last_location)')


def downgrade() -> None:
    """Downgrade schema."""
    op.execute('DROP INDEX IF EXISTS idx_user_last_location')
    op.drop_table('user')
