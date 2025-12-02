"""
Program: EECS 581 Project 3 - Live Chat Application
File: util.py (Security Utility Functions)
Description:
    Contains helper functions used for securely hashing and verifying passwords.
    Implements PBKDF2-HMAC with SHA-256, salted hashing, and constant-time
    comparisons to protect against brute-force and timing attacks.

Inputs:
    - Raw user passwords (on creation or login)
    - Stored password hashes retrieved from the database

Outputs:
    - Securely hashed password formatted with salt + iterations
    - Boolean results when verifying provided login credentials

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - Python hashlib documentation (pbkdf2_hmac)
    - OWASP Password Storage Guidelines
"""

from hashlib import pbkdf2_hmac
import hmac
import os


def hash_password(password: str, salt_length: int = 16, iterations: int = 100000) -> str:
    """
    Hash a password using PBKDF2-HMAC SHA-256.

    Steps:
        1. Generate a cryptographically random salt.
        2. Run PBKDF2 hashing with many iterations to slow brute-force attacks.
        3. Return formatted string containing:
            - salt (hex encoded)
            - resulting hash (hex encoded)
            - iteration count (integer)

    Args:
        password (str): Plain-text password to hash.
        salt_length (int): Number of random bytes for the salt (default: 16).
        iterations (int): Number of hashing iterations (default: 100,000).

    Returns:
        str: A database-storable string: "<salt>:<hash>:<iterations>"
    """
    # Generate unique random salt for each password
    salt = os.urandom(salt_length)

    # Create the key hash using PBKDF2-HMAC
    hashed = pbkdf2_hmac('sha256', password.encode(), salt, iterations)

    return f"{salt.hex()}:{hashed.hex()}:{iterations}"


def verify_password(stored_password: str, provided_password: str) -> bool:
    """
    Verify a provided password against a stored secure hash.

    Steps:
        1. Split stored password into salt + hash + iteration count.
        2. Re-hash the provided password using the same parameters.
        3. Compare using hmac.compare_digest() to prevent timing attacks.

    Args:
        stored_password (str): Stored password in "<salt>:<hash>:<iterations>" format.
        provided_password (str): Raw password entered by the user attempting login.

    Returns:
        bool: True if the password is correct, otherwise False.
    """
    # Extract parameters from stored password format
    salt, stored_hash, iterations = stored_password.split(':')

    # Recompute hash using stored salt + iteration count
    new_hash = pbkdf2_hmac(
        'sha256',
        provided_password.encode(),
        bytes.fromhex(salt),
        int(iterations),
    )

    # Constant-time compare protects against timing side-channel attacks
    return hmac.compare_digest(stored_hash, new_hash.hex())

