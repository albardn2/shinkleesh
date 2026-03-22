"""add post model

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-22 19:00:00.000000

"""
from typing import Sequence, Union

import geoalchemy2
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'post',
        sa.Column('uuid', sa.String(36), primary_key=True),
        sa.Column('user_uuid', sa.String(36), sa.ForeignKey('user.uuid'), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('lat', sa.Float, nullable=False),
        sa.Column('lng', sa.Float, nullable=False),
        sa.Column(
            'location',
            geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326),
            nullable=False,
        ),
        sa.Column('h3_l7', sa.String(15), nullable=False),
        sa.Column('vote_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('comment_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('is_hidden', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_post_user_uuid', 'post', ['user_uuid'])
    op.create_index('ix_post_h3_l7', 'post', ['h3_l7'])


def downgrade() -> None:
    op.drop_index('ix_post_h3_l7', table_name='post')
    op.drop_index('ix_post_user_uuid', table_name='post')
    op.drop_table('post')
