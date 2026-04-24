"""
Database connection manager for MySafePass
Handles SQLite with SQLCipher encryption setup and management.
"""

import os
import sqlite3
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
from typing import Optional
from .models import Base


class DatabaseManager:
    """Database manager for handling encrypted SQLite connections with SQLCipher."""

    def __init__(self, database_path: str, encryption_key: str):
        """
        Initialize the database manager.
        
        Args:
            database_path: Path to the SQLite database file
            encryption_key: Encryption key for SQLCipher
        """
        self.database_path = database_path
        self.encryption_key = encryption_key
        self.engine = None
        self.Session = None
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(database_path), exist_ok=True)
        
        self._initialize_engine()

    def _initialize_engine(self):
        """Initialize the SQLAlchemy engine with SQLCipher."""
        # SQLite URL with SQLCipher
        database_url = f"sqlite:///{self.database_path}"

        # Create engine with SQLCipher
        self.engine = create_engine(
            database_url,
            echo=False,  # Set to True for debugging
            poolclass=StaticPool,
            connect_args={
                "check_same_thread": False,
                "timeout": 10,  # Wait up to 10 seconds for database lock
            }
        )
        
        # Configure SQLCipher pragma
        @event.listens_for(self.engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            # Enable SQLCipher
            cursor.execute(f"PRAGMA key = '{self.encryption_key}'")
            # Set encryption settings
            cursor.execute("PRAGMA cipher_page_size = 4096")
            cursor.execute("PRAGMA kdf_iter = 64000")
            cursor.execute("PRAGMA cipher_hmac_algorithm = HMAC_SHA256")
            cursor.execute("PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA256")
            # Enable WAL mode for better concurrency
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000")
            cursor.close()

        # Create session factory
        session_factory = sessionmaker(bind=self.engine)
        self.Session = scoped_session(session_factory)

    def create_tables(self):
        """Create all tables in the database."""
        Base.metadata.create_all(bind=self.engine)

    def drop_tables(self):
        """Drop all tables (useful for testing)."""
        Base.metadata.drop_all(bind=self.engine)

    @contextmanager
    def get_session(self):
        """
        Get a database session with automatic cleanup.
        
        Usage:
            with db_manager.get_session() as session:
                # Use session
                pass
        """
        session = self.Session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def test_connection(self) -> bool:
        """
        Test if the database connection is working.
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            with self.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    def backup_database(self, backup_path: str):
        """
        Create a backup of the database.
        
        Args:
            backup_path: Path where the backup should be saved
        """
        # Create parent directory if it doesn't exist
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        
        # Copy the database file
        import shutil
        shutil.copy2(self.database_path, backup_path)

    def close(self):
        """Close the database connection."""
        if self.Session:
            self.Session.remove()
        if self.engine:
            self.engine.dispose()
