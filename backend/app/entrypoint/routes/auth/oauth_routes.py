import os
import re
import secrets
from datetime import timedelta

from flask import current_app, redirect, url_for
from flask_jwt_extended import create_access_token, create_refresh_token

from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.entrypoint.routes.auth import auth_blueprint
from models.common import User as UserModel

SUPPORTED_PROVIDERS = ('google', 'facebook', 'x')


def _sanitize_username(name: str) -> str:
    sanitized = re.sub(r'[^a-zA-Z0-9_]', '', name.replace(' ', '_'))
    return sanitized[:30] if sanitized else 'user'


def _generate_username(uow: SqlAlchemyUnitOfWork, display_name: str) -> str:
    base = _sanitize_username(display_name)
    if not uow.user_repository.find_one(username=base):
        return base
    for _ in range(10):
        candidate = f"{base}_{secrets.randbelow(9999)}"
        if not uow.user_repository.find_one(username=candidate):
            return candidate
    return f"{base}_{secrets.token_hex(4)}"


def _issue_jwt(user: UserModel) -> str:
    scopes = user.permission_scope.split(',') if user.permission_scope else []
    return create_access_token(
        identity=user.uuid,
        additional_claims={'scopes': scopes},
        expires_delta=timedelta(days=1),
    )


@auth_blueprint.route('/oauth/<provider>')
def oauth_login(provider: str):
    if provider not in SUPPORTED_PROVIDERS:
        return {'error': f'Unknown provider: {provider}'}, 400
    from app import oauth_client
    redirect_uri = url_for('auth.oauth_callback', provider=provider, _external=True)
    return oauth_client.create_client(provider).authorize_redirect(redirect_uri)


@auth_blueprint.route('/oauth/<provider>/callback')
def oauth_callback(provider: str):
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    if provider not in SUPPORTED_PROVIDERS:
        return redirect(f'{frontend_url}/?error=unknown_provider')

    try:
        from app import oauth_client
        client = oauth_client.create_client(provider)
        token = client.authorize_access_token()

        if provider == 'google':
            userinfo = token.get('userinfo') or client.userinfo()
            provider_id = userinfo['sub']
            email = userinfo.get('email')
            display_name = userinfo.get('name') or userinfo.get('email', provider_id)

        elif provider == 'facebook':
            resp = client.get('me?fields=id,name,email', token=token)
            userinfo = resp.json()
            provider_id = userinfo['id']
            email = userinfo.get('email')
            display_name = userinfo.get('name', provider_id)

        elif provider == 'x':
            resp = client.get('users/me', token=token)
            userinfo = resp.json()
            provider_id = userinfo['data']['id']
            email = None  # X requires elevated access for email
            display_name = userinfo['data'].get('username', provider_id)

        else:
            return redirect(f'{frontend_url}/?error=unknown_provider')

        with SqlAlchemyUnitOfWork() as uow:
            # Look up by OAuth provider ID first
            user = uow.user_repository.find_one(
                oauth_provider=provider,
                oauth_provider_id=provider_id,
                is_deleted=False,
            )

            # Email is verified by the OAuth provider (Google / Facebook confirm it)
            email_verified_by_provider = provider in ('google', 'facebook') and bool(email)

            # Fallback: match by email and link the OAuth account
            if not user and email:
                user = uow.user_repository.find_one(email=email, is_deleted=False)
                if user:
                    user.oauth_provider = provider
                    user.oauth_provider_id = provider_id
                    if email_verified_by_provider:
                        user.is_verified = True

            # No existing user — create one
            if not user:
                username = _generate_username(uow, display_name)
                user = UserModel(
                    username=username,
                    email=email,
                    oauth_provider=provider,
                    oauth_provider_id=provider_id,
                    is_verified=email_verified_by_provider,
                )
                user.set_password(secrets.token_hex(32))
                uow.user_repository.save(model=user, commit=False)

            if user.is_banned:
                return redirect(f'{frontend_url}/?error=banned')

            access_token = _issue_jwt(user)
            uow.commit()

        return redirect(f'{frontend_url}/?token={access_token}')

    except Exception as exc:
        current_app.logger.error(f'OAuth callback error [{provider}]: {exc}')
        return redirect(f'{frontend_url}/?error=oauth_failed')
