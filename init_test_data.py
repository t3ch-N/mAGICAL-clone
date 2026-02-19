#!/usr/bin/env python3
"""
Initialize test data for Magical Kenya Open API
Creates necessary test users and missing endpoints data
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

async def create_marshal_users(db):
    """Create test marshal users"""
    print("Creating marshal users...")
    
    # Check if marshal users already exist
    existing_chief = await db.marshal_users.find_one({"username": "chiefmarshal"})
    if existing_chief:
        print("  ✅ Chief marshal user already exists")
    else:
        chief_marshal = {
            "marshal_id": str(uuid.uuid4()),
            "username": "chiefmarshal",
            "password_hash": hash_password("MKO2026Admin!"),
            "full_name": "Chief Marshal",
            "role": "chief_marshal",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }
        await db.marshal_users.insert_one(chief_marshal)
        print("  ✅ Created chief marshal user")

async def create_webmaster_users(db):
    """Create test webmaster users"""
    print("Creating webmaster users...")
    
    # Note: Based on the server.py code, webmaster login uses the same endpoint structure
    # But I don't see a specific webmaster_users collection, let me check if it's just marshal users with webmaster role
    
    existing_webmaster = await db.marshal_users.find_one({"username": "webmaster"})
    if existing_webmaster:
        print("  ✅ Webmaster user already exists")
    else:
        webmaster = {
            "marshal_id": str(uuid.uuid4()),
            "username": "webmaster",
            "password_hash": hash_password("MKO2026Web!"),
            "full_name": "Webmaster",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }
        await db.marshal_users.insert_one(webmaster)
        print("  ✅ Created webmaster user")

async def create_accreditation_modules(db):
    """Create basic accreditation modules"""
    print("Creating accreditation modules...")
    
    existing = await db.accreditation_modules.count_documents({})
    if existing > 0:
        print("  ✅ Accreditation modules already exist")
        return
    
    tournament_id = "mko-2026"
    
    modules = [
        {
            "module_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "module_type": "volunteers",
            "name": "Volunteer Registration", 
            "slug": "volunteer-registration",
            "description": "Register as a volunteer for the tournament",
            "form_id": None,
            "is_active": True,
            "is_public": True,
            "settings": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "module_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "module_type": "media",
            "name": "Media Accreditation",
            "slug": "media-accreditation", 
            "description": "Apply for media accreditation",
            "form_id": None,
            "is_active": True,
            "is_public": True,
            "settings": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.accreditation_modules.insert_many(modules)
    print(f"  ✅ Created {len(modules)} accreditation modules")

async def create_pro_am_data(db):
    """Create basic Pro-Am data"""
    print("Creating Pro-Am data...")
    
    # Create Pro-Am settings
    existing_settings = await db.proam_settings.find_one({})
    if not existing_settings:
        proam_settings = {
            "settings_id": str(uuid.uuid4()),
            "registration_open": True,
            "tournament_date": "2026-02-19",
            "entry_fee": 5000,
            "max_participants": 120,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.proam_settings.insert_one(proam_settings)
        print("  ✅ Created Pro-Am settings")
    else:
        print("  ✅ Pro-Am settings already exist")
    
    # Create sample tee times
    existing_tee_times = await db.proam_tee_times.count_documents({})
    if existing_tee_times == 0:
        tee_times = [
            {
                "tee_time_id": str(uuid.uuid4()),
                "tee_time": "07:00",
                "available_spots": 4,
                "booked_spots": 0,
                "tee_number": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "tee_time_id": str(uuid.uuid4()),
                "tee_time": "07:30", 
                "available_spots": 4,
                "booked_spots": 2,
                "tee_number": 1,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.proam_tee_times.insert_many(tee_times)
        print(f"  ✅ Created {len(tee_times)} Pro-Am tee times")
    else:
        print("  ✅ Pro-Am tee times already exist")

async def create_sample_volunteers(db):
    """Create sample volunteer data"""
    print("Creating sample volunteers...")
    
    existing = await db.volunteers.count_documents({})
    if existing > 0:
        print("  ✅ Volunteers already exist")
        return
    
    volunteers = [
        {
            "volunteer_id": str(uuid.uuid4()),
            "first_name": "John",
            "last_name": "Doe",
            "nationality": "Kenyan",
            "identification_number": "12345678",
            "golf_club": "Karen Country Club",
            "email": "john.doe@example.com",
            "phone": "+254700000001",
            "role": "marshal",
            "volunteered_before": True,
            "availability_thursday": "all_day",
            "availability_friday": "morning",
            "availability_saturday": "all_day", 
            "availability_sunday": "afternoon",
            "photo_attached": False,
            "consent_given": True,
            "status": "approved",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "assigned_location": "Hole 1",
            "assigned_supervisor": "Chief Marshal",
            "notes": "Experienced volunteer"
        },
        {
            "volunteer_id": str(uuid.uuid4()),
            "first_name": "Jane",
            "last_name": "Smith", 
            "nationality": "Kenyan",
            "identification_number": "87654321",
            "golf_club": "Muthaiga Golf Club",
            "email": "jane.smith@example.com",
            "phone": "+254700000002",
            "role": "scorer",
            "volunteered_before": False,
            "availability_thursday": "morning",
            "availability_friday": "all_day",
            "availability_saturday": "all_day",
            "availability_sunday": "morning",
            "photo_attached": True,
            "consent_given": True,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "notes": "First time volunteer"
        }
    ]
    
    await db.volunteers.insert_many(volunteers)
    print(f"  ✅ Created {len(volunteers)} sample volunteers")

async def main():
    """Main initialization function"""
    print("🔧 Initializing Magical Kenya Open test data...")
    
    # Test connection
    conn_test = await test_connection()
    if not conn_test['success']:
        print(f"❌ Connection failed: {conn_test['message']}")
        return False
    
    print(f"✅ Connected to MongoDB: {conn_test['database']}")
    
    db = get_database()
    
    try:
        # Create all necessary test data
        await create_marshal_users(db)
        await create_webmaster_users(db)
        await create_accreditation_modules(db) 
        await create_pro_am_data(db)
        await create_sample_volunteers(db)
        
        print("\n✅ Test data initialization completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)