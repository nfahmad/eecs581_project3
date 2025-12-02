"""
Program: EECS 581 Project 3 - Live Chat Application
File: database.py (Database Configuration & ORM Models)
Description:
    Handles all database setup and ORM model definitions using SQLAlchemy.
    Key responsibilities:
        - Configure SQLite database connection
        - Define User, Room, and Message models with relationships
        - Provide dependency-injected DB session for FastAPI routes
        - Auto-generate tables during application startup

Inputs:
    - SQLAlchemy ORM field assignments as model attributes
    - Dependency injection requests for DB sessions in API routes

Outputs:
    - Persistent storage of users, rooms, and messages
    - Schema creation on app startup
    - SQLAlchemy Session instances for DB operations

Author: EECS 581 Project 3 Team
Date: November 23, 2025
Sources:
    - SQLAlchemy ORM documentation
    - FastAPI dependency injection documentation
    - EECS 581 course materials
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# ===================================================================
# Database Setup
# ===================================================================

# SQLite database (local development storage)
DATABASE_URL = "sqlite:///./chat_app.db"

# Engine creates DB connections; check_same_thread False required for SQLite + async
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Session factory: Autocommit disabled to require explicit commits
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class used to declare SQLAlchemy ORM models
Base = declarative_base()


# ===================================================================
# Database Models
# ===================================================================

class User(Base):
    """
    User model storing authentication + identity details.

    Relationships:
        - messages: All chat messages authored by the user
        - rooms: Rooms created by this user

    Notes:
        hashed_password ensures plain passwords are never stored.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    
    # ORM relationships:
    messages = relationship(
        "Message",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="[Message.user_id]",
    )
    rooms = relationship(
        "Room",
        back_populates="creator",
        cascade="all, delete-orphan",
        foreign_keys="[Room.creator_id]",
    )


class Room(Base):
    """
    Room model representing a chat room.

    Each room has:
        - A unique ID + name
        - Description (optional)
        - A creator (User)
        - A set of messages belonging to the room
    """
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    
    # ORM relationships:
    creator = relationship("User", back_populates="rooms", foreign_keys=[creator_id])
    messages = relationship(
        "Message",
        back_populates="room",
        cascade="all, delete-orphan",
        foreign_keys="[Message.room_id]",
    )


class Message(Base):
    """
    Message model representing individual chat entries.

    Stores:
        - Sender info (via foreign key)
        - Room reference
        - Text content of the message
        - Timestamps for creation/update
    """
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    
    # ORM relationships:
    user = relationship("User", back_populates="messages", foreign_keys=[user_id])
    room = relationship("Room", back_populates="messages", foreign_keys=[room_id])


# ===================================================================
# Database Utility Functions
# ===================================================================

def init_db():
    """
    Create all tables in the database if they do not already exist.

    Called once at app startup in server.__init__.py.
    """
    Base.metadata.create_all(bind=engine)


def get_db():
    """
    Dependency function for FastAPI routes.

    Provides a managed database session:
        - Opens a session for the duration of the request
        - Ensures the session is always closed afterward
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

        db.close()
