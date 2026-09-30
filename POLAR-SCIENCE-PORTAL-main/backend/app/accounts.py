"""Local accounts with scrypt password hashes and revocable HttpOnly sessions."""
import hashlib
import os
import secrets
import time
from fastapi import HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Float, select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from . import repository as repo

class Account(repo.Base):
    __tablename__ = 'accounts'
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    password = Column(String, nullable=False)

class LoginSession(repo.Base):
    __tablename__ = 'login_sessions'
    token_hash = Column(String, primary_key=True)
    account_id = Column(String, nullable=False)
    expires = Column(Float, nullable=False)

repo.Base.metadata.create_all(repo.engine)
COOKIE = 'dakshinsetu_session'
_attempts = {}

def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return f'{salt}:{digest}'

def check_password(password, stored):
    return secrets.compare_digest(hash_password(password, stored.split(':')[0]), stored)

def public_user(user):
    return {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}

def csrf(request):
    if request.headers.get('x-requested-with') != 'Dakshinsetu':
        raise HTTPException(403, 'Same-origin application request required')

def current_user(request):
    token = request.cookies.get(COOKIE, '')
    if not token: raise HTTPException(401, 'Please sign in')
    with Session(repo.engine) as session:
        login = session.get(LoginSession, hashlib.sha256(token.encode()).hexdigest())
        if not login or login.expires < time.time(): raise HTTPException(401, 'Session expired; please sign in')
        user = session.get(Account, login.account_id)
        if not user: raise HTTPException(401, 'Account unavailable')
        return public_user(user)

def require_role(request, roles):
    user = current_user(request)
    csrf(request)
    if user['role'] not in roles: raise HTTPException(403, 'This action requires an administrator')
    return user

class Credentials(BaseModel):
    email: str = Field(pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$', max_length=254)
    password: str = Field(min_length=12, max_length=128)

class Registration(Credentials):
    name: str = Field(min_length=2, max_length=120)

def throttle(request, email):
    stamp = time.monotonic()
    # IP and email limits prevent both account targeting and trivial email rotation.
    keys = [('ip', request.client.host if request.client else 'unknown'), ('email', email)]
    for key in keys:
        recent = [t for t in _attempts.get(key, []) if stamp-t < 300]
        if len(recent) >= 10: raise HTTPException(429, 'Too many attempts. Wait five minutes.')
        _attempts[key] = recent + [stamp]
    if len(_attempts) > 10000:
        for key in list(_attempts):
            if not _attempts[key] or stamp-_attempts[key][-1] > 300: del _attempts[key]

def create_account(email, name, password, role='researcher'):
    if role not in ('researcher', 'admin'): raise ValueError('Invalid role')
    if len(password) < 12 or len(password) > 128: raise ValueError('Password must be 12–128 characters')
    with Session(repo.engine) as session:
        account = Account(id=secrets.token_hex(12), email=email.strip().lower(), name=name.strip(), role=role, password=hash_password(password))
        session.add(account)
        try: session.commit()
        except IntegrityError:
            session.rollback()
            raise HTTPException(409, 'Account cannot be created with these details')
        return public_user(account)

@repo.app.post('/api/v1/auth/register')
def register(body: Registration, request: Request):
    csrf(request); throttle(request, body.email.lower())
    return {'user': create_account(body.email, body.name, body.password)}

@repo.app.post('/api/v1/auth/login')
def login(body: Credentials, request: Request, response: Response):
    csrf(request); throttle(request, body.email.lower())
    with Session(repo.engine) as session:
        user = session.scalar(select(Account).where(Account.email == body.email.strip().lower()))
        # Same expensive hash work for unknown accounts.
        stored = user.password if user else hash_password('unavailable-account-password', '0'*32)
        valid = check_password(body.password, stored)
        if not user or not valid: raise HTTPException(401, 'Incorrect email or password')
        token = secrets.token_urlsafe(32)
        session.execute(delete(LoginSession).where(LoginSession.expires < time.time()))
        old = request.cookies.get(COOKIE)
        if old: session.execute(delete(LoginSession).where(LoginSession.token_hash == hashlib.sha256(old.encode()).hexdigest()))
        session.add(LoginSession(token_hash=hashlib.sha256(token.encode()).hexdigest(), account_id=user.id, expires=time.time()+28800))
        session.commit()
        response.set_cookie(COOKIE, token, max_age=28800, httponly=True, secure=os.getenv('COOKIE_SECURE') == '1', samesite='strict', path='/')
        response.headers['Cache-Control'] = 'no-store'
        return {'user': public_user(user)}

@repo.app.get('/api/v1/auth/me')
def me(request: Request, response: Response):
    response.headers['Cache-Control'] = 'no-store'
    return {'user': current_user(request)}

@repo.app.post('/api/v1/auth/logout')
def logout(request: Request, response: Response):
    csrf(request)
    with Session(repo.engine) as session:
        session.execute(delete(LoginSession).where(LoginSession.token_hash == hashlib.sha256(request.cookies.get(COOKIE, '').encode()).hexdigest()))
        session.commit()
    response.delete_cookie(COOKIE, path='/')
    return {'status': 'signed-out'}
