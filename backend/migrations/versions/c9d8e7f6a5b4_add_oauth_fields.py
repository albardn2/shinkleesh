"""Add OAuth provider fields to user

Revision ID: c9d8e7f6a5b4
Revises: 718a4acba501
Create Date: 2026-03-22 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d8e7f6a5b4'
down_revision: Union[str, None] = '718a4acba501'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add oauth_provider and oauth_provider_id columns."""
    op.add_column('user', sa.Column('oauth_provider', sa.String(50), nullable=True))
    op.add_column('user', sa.Column('oauth_provider_id', sa.String(256), nullable=True))
    op.create_index('idx_user_oauth', 'user', ['oauth_provider', 'oauth_provider_id'])


def downgrade() -> None:
    """Remove oauth columns."""
    op.drop_index('idx_user_oauth', table_name='user')
    op.drop_column('user', 'oauth_provider_id')
    op.drop_column('user', 'oauth_provider')
