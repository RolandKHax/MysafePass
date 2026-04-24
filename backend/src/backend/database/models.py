"""
Database models for MySafePass
Implements the database schema requirements from the cahier des charges:
- SQLite with SQLCipher encryption
- Zero-knowledge architecture
- Audit trail
- Secure storage of user data
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, func
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model for storing user registration information."""
    
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=True, index=True)
    
    # Hashed master password (Argon2id)
    password_hash = Column(String(200), nullable=False)
    
    # Encryption salts
    verifier_salt = Column(String(100), nullable=False)  # For password verification
    encryption_salt = Column(String(100), nullable=False)  # For vault encryption
    
    # Account status and security
    is_active = Column(Boolean, default=True, nullable=False)
    failed_attempts = Column(Integer, default=0, nullable=False)
    total_failed_attempts = Column(Integer, default=0, nullable=False)
    lock_until = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class VaultEntry(Base):
    """Vault entry model for storing encrypted password entries."""
    
    __tablename__ = 'vault_entries'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Encrypted fields (stored as base64 strings)
    service = Column(Text, nullable=False)  # Encrypted service name
    username = Column(Text, nullable=False)  # Encrypted username
    password = Column(Text, nullable=False)  # Encrypted password
    url = Column(Text, nullable=True)  # Encrypted URL
    notes = Column(Text, nullable=True)  # Encrypted notes
    
    # Metadata (not encrypted, for indexing and searching)
    category = Column(String(100), default='Personnel', nullable=False)
    tags = Column(JSON, default=list, nullable=True)  # JSON array of tags
    
    # Security analysis results (not encrypted, for quick access)
    password_score = Column(Integer, default=0, nullable=False)  # 0-100
    entropy_bits = Column(Integer, default=0, nullable=False)
    crack_time_label = Column(String(50), default='', nullable=False)
    
    # Warnings (not encrypted)
    password_warnings = Column(JSON, default=list, nullable=True)  # JSON array
    domain_warnings = Column(JSON, default=list, nullable=True)  # JSON array
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_accessed_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    """Audit log model for tracking security events."""
    
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Event details
    event_type = Column(String(100), nullable=False)  # e.g., 'auth.success', 'entry.create'
    message = Column(Text, nullable=False)
    severity = Column(String(20), default='info', nullable=False)  # info, warning, critical
    
    # Additional context
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
