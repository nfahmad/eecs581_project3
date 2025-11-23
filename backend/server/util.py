from hashlib import pbkdf2_hmac
import hmac
import os

def hash_password(password: str, salt_length: int = 16, iterations: int = 100000) -> str:
    salt = os.urandom(salt_length)
    hashed = pbkdf2_hmac('sha256', password.encode(), salt, iterations)
    return f"{salt.hex()}:{hashed.hex()}:{iterations}"

def verify_password(stored_password: str, provided_password: str) -> bool:
    salt, stored_hash, iterations = stored_password.split(':')
    new_hash = pbkdf2_hmac('sha256', provided_password.encode(), bytes.fromhex(salt), int(iterations))
    return hmac.compare_digest(stored_hash, new_hash.hex())

