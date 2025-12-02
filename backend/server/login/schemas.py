"""
Program: EECS 581 Project 3 - Live Chat Application
File: schemas.py (Login Request Schemas)
Description:
    Defines the data validation models used for the login feature. These
    Pydantic models ensure that data received from client requests follows
    the expected structure and data types before reaching the application logic.

Inputs:
    - HTTP request body fields submitted during login:
        * username: str or email address
        * password: str

Outputs:
    - Validated and structured data passed to the login endpoint.

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - Pydantic documentation
    - FastAPI documentation
"""

from pydantic import BaseModel, EmailStr


class LoginReq(BaseModel):
    """
    Schema for validating user login input.

    Fields:
        username (str | EmailStr):
            Flexible identifier that can be either:
              - a traditional username (string)
              - a valid email address, validated automatically by EmailStr
        password (str):
            Raw password input from the user, hashing and validation occur later.

    This model ensures that login payloads sent to the API contain the correct
    structure before authentication logic is executed.
    """
    username: str | EmailStr
    password: str

