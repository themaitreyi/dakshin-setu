"""Run locally: python create_admin.py. Never ships a default administrator password."""
from getpass import getpass
from app.accounts import create_account

if __name__ == '__main__':
    email = input('Administrator email: ').strip()
    name = input('Display name: ').strip()
    password = getpass('Password (12–128 characters): ')
    if password != getpass('Confirm password: '): raise SystemExit('Passwords do not match')
    create_account(email, name, password, 'admin')
    print('Administrator created. Sign in through the website.')
