"""
MySafePass Backend Entry Point
"""

import os
from dotenv import load_dotenv
from src.backend.api.routes import create_app
from src.backend.database.connection import DatabaseManager

# Load environment variables
load_dotenv()

app = create_app()

if __name__ == '__main__':
    # Get configuration from environment
    host = os.getenv('HOST', 'localhost')
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    # Create tables if they don't exist
    db_manager = DatabaseManager(
        database_path=os.getenv('DATABASE_PATH', 'data/mysafepass.db'),
        encryption_key=os.getenv('DATABASE_ENCRYPTION_KEY', 'dev-encryption-key-32-chars-long')
    )
    db_manager.create_tables()
    
    print(f"Starting MySafePass Backend on {host}:{port}")
    app.run(host=host, port=port, debug=debug)