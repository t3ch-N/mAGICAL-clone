#!/usr/bin/env python3
"""
Create webmaster users in the correct collection
"""

import asyncio
import sys
import os
from datetime import datetime, timezone
import bcrypt
import uuid

# Add the backend directory to the path
sys.path.append('/app/backend')

from mongodb.connection import get_database, test_connection

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_webmaster_users_correctly(db):
    """Create webmaster users in webmaster_users collection"""
    print("Creating webmaster users in correct collection...")
    
    # Check if webmaster users already exist
    existing_webmaster = await db.webmaster_users.find_one({"username": "webmaster"})
    if existing_webmaster:
        print("  ✅ Webmaster user already exists in webmaster_users")
    else:
        webmaster = {
            "user_id": str(uuid.uuid4()),
            "username": "webmaster",
            "password_hash": hash_password("MKO2026Web!"),
            "full_name": "Webmaster",
            "role": "webmaster",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }
        await db.webmaster_users.insert_one(webmaster)
        print("  ✅ Created webmaster user in webmaster_users collection")

async def main():
    """Main function"""
    print("🔧 Creating webmaster users...")
    
    # Test connection
    conn_test = await test_connection()
    if not conn_test['success']:
        print(f"❌ Connection failed: {conn_test['message']}")
        return False
    
    print(f"✅ Connected to MongoDB: {conn_test['database']}")
    
    db = get_database()
    
    try:
        await create_webmaster_users_correctly(db)
        print("\n✅ Webmaster user creation completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during creation: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)