"""add voting

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-03-23 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'e4f5a6b7c8d9'
down_revision: Union[str, None] = 'd3e4f5a6b7c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add vote_count to comment table
    op.add_column('comment', sa.Column('vote_count', sa.Integer, nullable=False, server_default='0'))

    # Create vote table
    op.create_table(
        'vote',
        sa.Column('uuid', sa.String(36), primary_key=True),
        sa.Column('user_uuid', sa.String(36), sa.ForeignKey('user.uuid'), nullable=False),
        sa.Column('target_type', sa.String(10), nullable=False),
        sa.Column('target_uuid', sa.String(36), nullable=False),
        sa.Column('vote_type', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_uuid', 'target_type', 'target_uuid', name='uq_vote_user_target'),
    )
    op.create_index('ix_vote_user_uuid', 'vote', ['user_uuid'])
    op.create_index('ix_vote_target_uuid', 'vote', ['target_uuid'])


def downgrade() -> None:
    op.drop_index('ix_vote_target_uuid', table_name='vote')
    op.drop_index('ix_vote_user_uuid', table_name='vote')
    op.drop_table('vote')
    op.drop_column('comment', 'vote_count')
