from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Magical Kenya Open API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== ENUMS =====================
class UserRole(str, Enum):
    ADMIN = "admin"
    MEDIA = "media"
    VOLUNTEER = "volunteer"
    VENDOR = "vendor"
    JUNIOR_GOLF = "junior_golf"
    PUBLIC = "public"

class RoleStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ContentStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"

class ContentType(str, Enum):
    NEWS = "news"
    PHOTO = "photo"
    VIDEO = "video"

# ===================== MODELS =====================
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.PUBLIC
    role_status: RoleStatus = RoleStatus.PENDING
    requested_role: Optional[UserRole] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    role_status: Optional[RoleStatus] = None
    organization: Optional[str] = None
    phone: Optional[str] = None

class RegistrationRequest(BaseModel):
    requested_role: UserRole
    organization: Optional[str] = None
    phone: Optional[str] = None
    reason: Optional[str] = None

class Player(BaseModel):
    player_id: str = Field(default_factory=lambda: f"player_{uuid.uuid4().hex[:12]}")
    name: str
    country: str
    country_code: str
    photo_url: Optional[str] = None
    world_ranking: Optional[int] = None
    bio: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaderboardEntry(BaseModel):
    entry_id: str = Field(default_factory=lambda: f"entry_{uuid.uuid4().hex[:12]}")
    player_id: str
    position: int
    score_to_par: int
    round1: Optional[int] = None
    round2: Optional[int] = None
    round3: Optional[int] = None
    round4: Optional[int] = None
    total_score: int
    thru: str = "F"
    today: Optional[int] = None
    is_cut: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewsArticle(BaseModel):
    article_id: str = Field(default_factory=lambda: f"article_{uuid.uuid4().hex[:12]}")
    title: str
    slug: str
    excerpt: str
    content: str
    featured_image: Optional[str] = None
    category: str = "news"
    status: ContentStatus = ContentStatus.DRAFT
    author_id: str
    author_name: str
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

class NewsArticleCreate(BaseModel):
    title: str
    excerpt: str
    content: str
    featured_image: Optional[str] = None
    category: str = "news"
    tags: List[str] = []

class GalleryItem(BaseModel):
    item_id: str = Field(default_factory=lambda: f"gallery_{uuid.uuid4().hex[:12]}")
    title: str
    description: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    content_type: ContentType = ContentType.PHOTO
    category: str = "general"
    status: ContentStatus = ContentStatus.DRAFT
    author_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None

class GalleryItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    content_type: ContentType = ContentType.PHOTO
    category: str = "general"

class TicketPackage(BaseModel):
    package_id: str = Field(default_factory=lambda: f"pkg_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    price_range: str
    features: List[str]
    category: str  # "daily", "weekly", "hospitality"
    image_url: Optional[str] = None
    booking_url: Optional[str] = None
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnquiryForm(BaseModel):
    enquiry_id: str = Field(default_factory=lambda: f"enq_{uuid.uuid4().hex[:12]}")
    name: str
    email: str
    phone: Optional[str] = None
    enquiry_type: str  # "tickets", "hospitality", "media", "general"
    package_id: Optional[str] = None
    message: str
    status: str = "new"  # new, contacted, resolved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnquiryFormCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    enquiry_type: str
    package_id: Optional[str] = None
    message: str

class ContactMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

# ===================== AUTH HELPERS =====================
async def get_session_from_request(request: Request) -> Optional[dict]:
    """Extract and validate session from cookies or Authorization header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    return session_doc

async def get_current_user(request: Request) -> Optional[User]:
    """Get current authenticated user"""
    session = await get_session_from_request(request)
    if not session:
        return None
    
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Dependency that requires authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> User:
    """Dependency that requires admin role"""
    user = await require_auth(request)
    if user.role != UserRole.ADMIN or user.role_status != RoleStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===================== AUTH ROUTES =====================
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    auth_data = auth_response.json()
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": UserRole.PUBLIC.value,
            "role_status": RoleStatus.PENDING.value,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user data"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session = await get_session_from_request(request)
    if session:
        await db.user_sessions.delete_one({"session_token": session["session_token"]})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/request-role")
async def request_role(request: Request, reg: RegistrationRequest):
    """Request a specific role (media, volunteer, vendor, junior_golf)"""
    user = await require_auth(request)
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "requested_role": reg.requested_role.value,
            "organization": reg.organization,
            "phone": reg.phone,
            "role_status": RoleStatus.PENDING.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create registration request record
    await db.registration_requests.insert_one({
        "request_id": f"req_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "requested_role": reg.requested_role.value,
        "organization": reg.organization,
        "phone": reg.phone,
        "reason": reg.reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Role request submitted successfully"}

# ===================== ADMIN ROUTES =====================
@api_router.get("/admin/users")
async def get_all_users(request: Request, role: Optional[str] = None, status: Optional[str] = None):
    """Get all users (admin only)"""
    await require_admin(request)
    
    query = {}
    if role:
        query["role"] = role
    if status:
        query["role_status"] = status
    
    users = await db.users.find(query, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/registration-requests")
async def get_registration_requests(request: Request, status: Optional[str] = "pending"):
    """Get registration requests (admin only)"""
    await require_admin(request)
    
    query = {"status": status} if status else {}
    requests = await db.registration_requests.find(query, {"_id": 0}).to_list(1000)
    return requests

@api_router.put("/admin/users/{user_id}/approve")
async def approve_user(request: Request, user_id: str):
    """Approve user role request (admin only)"""
    await require_admin(request)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    requested_role = user_doc.get("requested_role", UserRole.PUBLIC.value)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "role": requested_role,
            "role_status": RoleStatus.APPROVED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.registration_requests.update_one(
        {"user_id": user_id, "status": "pending"},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "User approved successfully"}

@api_router.put("/admin/users/{user_id}/reject")
async def reject_user(request: Request, user_id: str):
    """Reject user role request (admin only)"""
    await require_admin(request)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "role_status": RoleStatus.REJECTED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.registration_requests.update_one(
        {"user_id": user_id, "status": "pending"},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "User rejected"}

@api_router.put("/admin/users/{user_id}")
async def update_user(request: Request, user_id: str, update: UserUpdate):
    """Update user details (admin only)"""
    await require_admin(request)
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    
    return {"message": "User updated successfully"}

# ===================== LEADERBOARD ROUTES =====================
@api_router.get("/players")
async def get_players(active_only: bool = True):
    """Get all players"""
    query = {"is_active": True} if active_only else {}
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    return players

@api_router.get("/players/{player_id}")
async def get_player(player_id: str):
    """Get single player"""
    player = await db.players.find_one({"player_id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api_router.get("/leaderboard")
async def get_leaderboard():
    """Get current leaderboard"""
    entries = await db.leaderboard.find({}, {"_id": 0}).sort("position", 1).to_list(1000)
    
    # Enrich with player data
    for entry in entries:
        player = await db.players.find_one({"player_id": entry["player_id"]}, {"_id": 0})
        if player:
            entry["player_name"] = player.get("name")
            entry["country"] = player.get("country")
            entry["country_code"] = player.get("country_code")
            entry["photo_url"] = player.get("photo_url")
    
    return entries

@api_router.post("/admin/players")
async def create_player(request: Request, player: Player):
    """Create player (admin only)"""
    await require_admin(request)
    
    player_dict = player.model_dump()
    player_dict["created_at"] = player_dict["created_at"].isoformat()
    await db.players.insert_one(player_dict)
    return player_dict

@api_router.put("/admin/leaderboard/{entry_id}")
async def update_leaderboard_entry(request: Request, entry_id: str, entry: LeaderboardEntry):
    """Update leaderboard entry (admin only)"""
    await require_admin(request)
    
    entry_dict = entry.model_dump()
    entry_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.leaderboard.update_one(
        {"entry_id": entry_id},
        {"$set": entry_dict},
        upsert=True
    )
    return entry_dict

# ===================== NEWS/CONTENT ROUTES =====================
@api_router.get("/news")
async def get_news(status: Optional[str] = "published", category: Optional[str] = None, limit: int = 20):
    """Get news articles"""
    query = {"status": status} if status else {}
    if category:
        query["category"] = category
    
    articles = await db.news.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return articles

@api_router.get("/news/{article_id}")
async def get_article(article_id: str):
    """Get single article"""
    article = await db.news.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@api_router.post("/admin/news")
async def create_article(request: Request, article: NewsArticleCreate):
    """Create news article (admin only)"""
    user = await require_admin(request)
    
    slug = article.title.lower().replace(" ", "-")[:50]
    
    new_article = NewsArticle(
        title=article.title,
        slug=slug,
        excerpt=article.excerpt,
        content=article.content,
        featured_image=article.featured_image,
        category=article.category,
        tags=article.tags,
        author_id=user.user_id,
        author_name=user.name
    )
    
    article_dict = new_article.model_dump()
    article_dict["created_at"] = article_dict["created_at"].isoformat()
    await db.news.insert_one(article_dict)
    return article_dict

@api_router.put("/admin/news/{article_id}")
async def update_article(request: Request, article_id: str, update: dict):
    """Update article (admin only)"""
    await require_admin(request)
    
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update.get("status") == "published" and not update.get("published_at"):
        update["published_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.news.update_one({"article_id": article_id}, {"$set": update})
    return {"message": "Article updated"}

@api_router.delete("/admin/news/{article_id}")
async def delete_article(request: Request, article_id: str):
    """Delete article (admin only)"""
    await require_admin(request)
    await db.news.delete_one({"article_id": article_id})
    return {"message": "Article deleted"}

# ===================== GALLERY ROUTES =====================
@api_router.get("/gallery")
async def get_gallery(content_type: Optional[str] = None, category: Optional[str] = None, limit: int = 50):
    """Get gallery items"""
    query = {"status": "published"}
    if content_type:
        query["content_type"] = content_type
    if category:
        query["category"] = category
    
    items = await db.gallery.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return items

@api_router.post("/admin/gallery")
async def create_gallery_item(request: Request, item: GalleryItemCreate):
    """Create gallery item (admin only)"""
    user = await require_admin(request)
    
    new_item = GalleryItem(
        title=item.title,
        description=item.description,
        media_url=item.media_url,
        thumbnail_url=item.thumbnail_url,
        content_type=item.content_type,
        category=item.category,
        author_id=user.user_id
    )
    
    item_dict = new_item.model_dump()
    item_dict["created_at"] = item_dict["created_at"].isoformat()
    await db.gallery.insert_one(item_dict)
    return item_dict

@api_router.put("/admin/gallery/{item_id}")
async def update_gallery_item(request: Request, item_id: str, update: dict):
    """Update gallery item (admin only)"""
    await require_admin(request)
    
    if update.get("status") == "published" and not update.get("published_at"):
        update["published_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.gallery.update_one({"item_id": item_id}, {"$set": update})
    return {"message": "Gallery item updated"}

# ===================== TICKETS ROUTES =====================
@api_router.get("/tickets/packages")
async def get_ticket_packages(category: Optional[str] = None):
    """Get ticket packages"""
    query = {"is_available": True}
    if category:
        query["category"] = category
    
    packages = await db.ticket_packages.find(query, {"_id": 0}).to_list(100)
    return packages

@api_router.post("/admin/tickets/packages")
async def create_ticket_package(request: Request, package: TicketPackage):
    """Create ticket package (admin only)"""
    await require_admin(request)
    
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.ticket_packages.insert_one(package_dict)
    return package_dict

@api_router.post("/enquiries")
async def create_enquiry(enquiry: EnquiryFormCreate):
    """Submit enquiry form"""
    new_enquiry = EnquiryForm(**enquiry.model_dump())
    enquiry_dict = new_enquiry.model_dump()
    enquiry_dict["created_at"] = enquiry_dict["created_at"].isoformat()
    await db.enquiries.insert_one(enquiry_dict)
    return {"message": "Enquiry submitted successfully", "enquiry_id": new_enquiry.enquiry_id}

@api_router.get("/admin/enquiries")
async def get_enquiries(request: Request, status: Optional[str] = None):
    """Get all enquiries (admin only)"""
    await require_admin(request)
    
    query = {"status": status} if status else {}
    enquiries = await db.enquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return enquiries

# ===================== CONTACT ROUTES =====================
@api_router.post("/contact")
async def create_contact_message(message: ContactMessageCreate):
    """Submit contact form"""
    new_message = ContactMessage(**message.model_dump())
    message_dict = new_message.model_dump()
    message_dict["created_at"] = message_dict["created_at"].isoformat()
    await db.contact_messages.insert_one(message_dict)
    return {"message": "Message sent successfully"}

@api_router.get("/admin/contact")
async def get_contact_messages(request: Request):
    """Get all contact messages (admin only)"""
    await require_admin(request)
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return messages

# ===================== TOURNAMENT INFO =====================
@api_router.get("/tournament/info")
async def get_tournament_info():
    """Get tournament information"""
    info = await db.tournament_info.find_one({}, {"_id": 0})
    if not info:
        # Return default info
        return {
            "name": "Magical Kenya Open",
            "year": 2025,
            "dates": "March 6-9, 2025",
            "venue": "Muthaiga Golf Club",
            "location": "Nairobi, Kenya",
            "purse": "$2,000,000",
            "defending_champion": "Guido Migliozzi",
            "course_par": 71,
            "course_yards": 6902
        }
    return info

@api_router.get("/tournament/schedule")
async def get_tournament_schedule():
    """Get tournament schedule"""
    schedule = await db.tournament_schedule.find({}, {"_id": 0}).to_list(100)
    if not schedule:
        return [
            {"day": "Thursday", "date": "March 6", "event": "Round 1", "time": "07:00 - 18:00"},
            {"day": "Friday", "date": "March 7", "event": "Round 2", "time": "07:00 - 18:00"},
            {"day": "Saturday", "date": "March 8", "event": "Round 3", "time": "08:00 - 17:00"},
            {"day": "Sunday", "date": "March 9", "event": "Final Round", "time": "08:00 - 17:00"}
        ]
    return schedule

@api_router.get("/tournament/past-winners")
async def get_past_winners():
    """Get past tournament winners"""
    winners = await db.past_winners.find({}, {"_id": 0}).sort("year", -1).to_list(100)
    if not winners:
        return [
            {"year": 2024, "winner": "Guido Migliozzi", "country": "Italy", "score": "-17"},
            {"year": 2023, "winner": "Ewen Ferguson", "country": "Scotland", "score": "-21"},
            {"year": 2022, "winner": "Justin Harding", "country": "South Africa", "score": "-16"},
            {"year": 2021, "winner": "Justin Harding", "country": "South Africa", "score": "-21"},
            {"year": 2020, "winner": "Cancelled", "country": "", "score": ""},
            {"year": 2019, "winner": "Guido Migliozzi", "country": "Italy", "score": "-22"}
        ]
    return winners

# ===================== HEALTH CHECK =====================
@api_router.get("/")
async def root():
    return {"message": "Magical Kenya Open API", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
