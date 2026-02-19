"""
Add missing endpoints for testing
Patches the server.py to add webmaster login and make some endpoints public
"""

# Insert webmaster login endpoint after marshal login
webmaster_login_code = '''
@api_router.post("/webmaster/login")
async def webmaster_login(credentials: MarshalLogin, response: Response):
    """Webmaster dashboard login"""
    # Check both webmaster_users and marshal_users for webmaster role
    username_lower = credentials.username.lower()
    
    # First try webmaster_users collection
    user = await db.webmaster_users.find_one({"username": username_lower}, {"_id": 0})
    
    # If not found, try marshal_users with webmaster role
    if not user:
        user = await db.marshal_users.find_one({"username": username_lower, "role": {"$in": ["webmaster", "admin"]}}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Username not found")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled. Contact administrator.")
    
    # Create session (reuse marshal session structure)
    session_id = secrets.token_urlsafe(32)
    session_data = {
        "session_id": session_id,
        "marshal_id": user.get("marshal_id", user.get("user_id")),
        "username": user["username"],
        "role": user["role"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    }
    
    await db.webmaster_sessions.insert_one(session_data)
    
    # Update last login
    if "marshal_id" in user:
        await db.marshal_users.update_one(
            {"marshal_id": user["marshal_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await db.webmaster_users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Set cookie
    response.set_cookie(
        key="webmaster_session",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=8 * 60 * 60 # 8 hours
    )
    
    return {
        "success": True,
        "session_id": session_id,
        "user": {
            "user_id": user.get("marshal_id", user.get("user_id")),
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }
'''

# Create public Pro-Am tee-times endpoint
public_proam_teetimes_code = '''
@api_router.get("/pro-am/tee-times/public")
async def get_public_proam_tee_times():
    """Get Pro-Am tee times for public display"""
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else "mko-2026"
    
    tee_times = await db.proam_tee_times.find(
        {"tournament_id": tournament_id},
        {"_id": 0}
    ).sort([("tee_number", 1), ("tee_time", 1)]).to_list(100)
    
    return {
        "tournament_id": tournament_id,
        "tee_times": tee_times,
        "total_count": len(tee_times)
    }
'''

# Create public accreditation stats endpoint  
public_accred_stats_code = '''
@api_router.get("/accreditation/stats/public")
async def get_public_accreditation_stats():
    """Get public accreditation statistics"""
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else "mko-2026"
    
    # Get module counts
    modules = await db.accreditation_modules.find({"tournament_id": tournament_id, "is_active": True}, {"_id": 0}).to_list(100)
    
    stats = {
        "tournament_id": tournament_id,
        "modules_count": len(modules),
        "modules": [{"name": m["name"], "type": m["module_type"], "is_public": m["is_public"]} for m in modules]
    }
    
    return stats
'''

print("Adding missing endpoints to server.py...")

with open('/app/backend/server.py', 'r') as f:
    content = f.read()

# Insert webmaster login after marshal logout
insert_pos = content.find('@api_router.post("/marshal/logout")')
if insert_pos != -1:
    # Find the end of marshal logout function
    lines = content[insert_pos:].split('\n')
    func_end = 0
    for i, line in enumerate(lines):
        if line.startswith('@api_router') and i > 0:
            func_end = i
            break
    
    if func_end == 0:
        func_end = len(lines)
    
    # Calculate position
    marshal_logout_end = insert_pos + len('\n'.join(lines[:func_end]))
    
    # Insert webmaster login
    content = content[:marshal_logout_end] + '\n\n' + webmaster_login_code + '\n' + content[marshal_logout_end:]

# Add public endpoints at the end before health checks
health_check_pos = content.find('# ===================== HEALTH CHECK =====================')
if health_check_pos != -1:
    content = content[:health_check_pos] + public_proam_teetimes_code + '\n\n' + public_accred_stats_code + '\n\n' + content[health_check_pos:]

with open('/app/backend/server.py', 'w') as f:
    f.write(content)

print("✅ Added missing endpoints to server.py")