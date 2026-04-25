import os
import re
import secrets
from datetime import timedelta

import jwt
import requests
from flask import current_app, redirect, request, session, url_for
from flask_jwt_extended import create_access_token, create_refresh_token

from app.adapters.unit_of_work.sqlalchemy_unit_of_work import SqlAlchemyUnitOfWork
from app.entrypoint.routes.auth import auth_blueprint
from models.common import User as UserModel

SUPPORTED_PROVIDERS = ('google',)

# Mobile deep-link schemes allowed to receive the OAuth token. Prevents the
# redirect_uri query param from being used as an open redirect.
ALLOWED_MOBILE_REDIRECT_PREFIXES = ('shinkleesh://', 'exp+shinkleesh://')
MOBILE_REDIRECT_SESSION_KEY = 'oauth_mobile_redirect'

APPLE_ISSUER = 'https://appleid.apple.com'
APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'
# Audience Apple stamps on the identity token = our iOS bundle identifier
# (native Sign in with Apple uses the bundle ID, not a Services ID).
APPLE_IOS_BUNDLE_ID = 'com.albardn2.shinkleesh'


def _is_allowed_mobile_redirect(uri: str) -> bool:
    return any(uri.startswith(p) for p in ALLOWED_MOBILE_REDIRECT_PREFIXES)


def _build_redirect(mobile_uri: str | None, **params: str) -> str:
    if mobile_uri:
        base = mobile_uri
    else:
        base = os.environ.get('FRONTEND_URL', 'http://localhost:5173').rstrip('/') + '/'
    separator = '&' if '?' in base else '?'
    query = '&'.join(f'{k}={v}' for k, v in params.items())
    return f'{base}{separator}{query}'


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


def _upsert_oauth_user(provider: str, provider_id: str, email: str | None,
                       display_name: str, email_verified: bool) -> UserModel | str:
    """Find-or-create a user for an OAuth identity. Returns the user, or an
    error code string ('banned') the caller should surface."""
    with SqlAlchemyUnitOfWork() as uow:
        user = uow.user_repository.find_one(
            oauth_provider=provider,
            oauth_provider_id=provider_id,
            is_deleted=False,
        )

        if not user and email:
            user = uow.user_repository.find_one(email=email, is_deleted=False)
            if user:
                user.oauth_provider = provider
                user.oauth_provider_id = provider_id
                if email_verified:
                    user.is_verified = True

        if not user:
            username = _generate_username(uow, display_name)
            user = UserModel(
                username=username,
                email=email,
                oauth_provider=provider,
                oauth_provider_id=provider_id,
                is_verified=email_verified,
            )
            user.set_password(secrets.token_hex(32))
            uow.user_repository.save(model=user, commit=False)

        if user.is_banned:
            return 'banned'

        access_token = _issue_jwt(user)
        uow.commit()
        return access_token


@auth_blueprint.route('/oauth/<provider>')
def oauth_login(provider: str):
    if provider not in SUPPORTED_PROVIDERS:
        return {'error': f'Unknown provider: {provider}'}, 400

    mobile_redirect = request.args.get('redirect_uri')
    if mobile_redirect and _is_allowed_mobile_redirect(mobile_redirect):
        session[MOBILE_REDIRECT_SESSION_KEY] = mobile_redirect
    else:
        session.pop(MOBILE_REDIRECT_SESSION_KEY, None)

    from app import oauth_client
    redirect_uri = url_for('auth.oauth_callback', provider=provider, _external=True)
    return oauth_client.create_client(provider).authorize_redirect(redirect_uri)


@auth_blueprint.route('/oauth/<provider>/callback')
def oauth_callback(provider: str):
    mobile_redirect = session.pop(MOBILE_REDIRECT_SESSION_KEY, None)

    if provider not in SUPPORTED_PROVIDERS:
        return redirect(_build_redirect(mobile_redirect, error='unknown_provider'))

    try:
        from app import oauth_client
        client = oauth_client.create_client(provider)
        token = client.authorize_access_token()

        if provider == 'google':
            userinfo = token.get('userinfo') or client.userinfo()
            provider_id = userinfo['sub']
            email = userinfo.get('email')
            display_name = userinfo.get('name') or userinfo.get('email', provider_id)
            email_verified = bool(email)
        else:
            return redirect(_build_redirect(mobile_redirect, error='unknown_provider'))

        result = _upsert_oauth_user(provider, provider_id, email, display_name, email_verified)
        if result == 'banned':
            return redirect(_build_redirect(mobile_redirect, error='banned'))
        return redirect(_build_redirect(mobile_redirect, token=result))

    except Exception as exc:
        current_app.logger.error(f'OAuth callback error [{provider}]: {exc}')
        return redirect(_build_redirect(mobile_redirect, error='oauth_failed'))


@auth_blueprint.route('/oauth/apple/native', methods=['POST'])
def oauth_apple_native():
    """Native Sign in with Apple from the iOS app.

    The client (expo-apple-authentication) returns a signed identity_token
    JWT after the user authenticates on-device. We verify the signature
    against Apple's published JWKS and the audience against our bundle ID.
    """
    payload = request.get_json(silent=True) or {}
    identity_token = payload.get('identity_token')
    full_name = (payload.get('full_name') or '').strip() or None

    if not identity_token:
        return {'error': 'missing_identity_token'}, 400

    try:
        unverified_header = jwt.get_unverified_header(identity_token)
        kid = unverified_header.get('kid')
        if not kid:
            return {'error': 'invalid_identity_token'}, 400

        jwks = requests.get(APPLE_KEYS_URL, timeout=5).json()
        key_data = next((k for k in jwks.get('keys', []) if k.get('kid') == kid), None)
        if not key_data:
            return {'error': 'unknown_signing_key'}, 400

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
        claims = jwt.decode(
            identity_token,
            public_key,
            algorithms=[key_data.get('alg', 'RS256')],
            audience=APPLE_IOS_BUNDLE_ID,
            issuer=APPLE_ISSUER,
        )
    except jwt.PyJWTError as exc:
        current_app.logger.warning(f'Apple token verification failed: {exc}')
        return {'error': 'invalid_identity_token'}, 401
    except Exception as exc:
        current_app.logger.error(f'Apple Sign-In error: {exc}')
        return {'error': 'apple_verification_failed'}, 500

    provider_id = claims.get('sub')
    if not provider_id:
        return {'error': 'invalid_identity_token'}, 400

    email = claims.get('email')
    email_verified = str(claims.get('email_verified', 'false')).lower() == 'true'
    display_name = full_name or email or provider_id

    result = _upsert_oauth_user('apple', provider_id, email, display_name, email_verified)
    if result == 'banned':
        return {'error': 'banned'}, 403
    return {'access_token': result}, 200
