"""rename is_email_verified to is_verified

Revision ID: a1b2c3d4e5f6
Revises: 3ed8e34bd18a
Create Date: 2026-03-22 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3ed8e34bd18a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('user', 'is_email_verified', new_column_name='is_verified')


def downgrade() -> None:
    op.alter_column('user', 'is_verified', new_column_name='is_email_verified')
