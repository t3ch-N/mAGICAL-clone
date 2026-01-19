from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import aiofiles
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import shutil

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

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create policies directory
POLICIES_DIR = ROOT_DIR / "policies"
POLICIES_DIR.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== EMAIL CONFIG =====================
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', SMTP_USER)
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'Magical Kenya Open')

async def send_email(to_email: str, subject: str, html_content: str, plain_content: str = None):
    """Send email via Gmail SMTP"""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured - email not sent")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add plain text version
        if plain_content:
            part1 = MIMEText(plain_content, "plain")
            message.attach(part1)
        
        # Add HTML version
        part2 = MIMEText(html_content, "html")
        message.attach(part2)
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASSWORD
        )
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

async def send_approval_email(user_email: str, user_name: str, role: str):
    """Send approval notification email"""
    subject = "Your Magical Kenya Open Registration Has Been Approved!"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1a472a; color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; background: #fdfbf7; }}
            .badge {{ display: inline-block; background: #e31937; color: white; padding: 5px 15px; font-size: 12px; text-transform: uppercase; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
            .btn {{ display: inline-block; background: #1a472a; color: white; padding: 12px 30px; text-decoration: none; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Magical Kenya Open 2026</h1>
            </div>
            <div class="content">
                <span class="badge">Registration Approved</span>
                <h2>Congratulations, {user_name}!</h2>
                <p>Your registration for the <strong>Magical Kenya Open 2026</strong> has been approved.</p>
                <p><strong>Role:</strong> {role.replace('_', ' ').title()}</p>
                <p>You now have access to the restricted areas of our website based on your role. Log in to access exclusive content and resources.</p>
                <p><strong>Event Details:</strong></p>
                <ul>
                    <li>Date: February 19-22, 2026</li>
                    <li>Venue: Karen Country Club, Nairobi</li>
                </ul>
                <p>We look forward to seeing you at the tournament!</p>
            </div>
            <div class="footer">
                <p>Kenya Open Golf Limited | Nairobi, Kenya</p>
                <p>info@magicalkenyaopen.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    Congratulations, {user_name}!
    
    Your registration for the Magical Kenya Open 2026 has been approved.
    
    Role: {role.replace('_', ' ').title()}
    
    You now have access to the restricted areas of our website based on your role.
    
    Event Details:
    - Date: February 19-22, 2026
    - Venue: Karen Country Club, Nairobi
    
    We look forward to seeing you at the tournament!
    
    ---
    Kenya Open Golf Limited
    info@magicalkenyaopen.com
    """
    
    return await send_email(user_email, subject, html_content, plain_content)

async def send_rejection_email(user_email: str, user_name: str, role: str):
    """Send rejection notification email"""
    subject = "Update on Your Magical Kenya Open Registration"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1a472a; color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; background: #fdfbf7; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Magical Kenya Open 2026</h1>
            </div>
            <div class="content">
                <h2>Dear {user_name},</h2>
                <p>Thank you for your interest in the Magical Kenya Open 2026.</p>
                <p>After careful review, we regret to inform you that we are unable to approve your registration as <strong>{role.replace('_', ' ').title()}</strong> at this time.</p>
                <p>This may be due to limited availability or incomplete documentation. If you believe this was an error or would like more information, please contact our team.</p>
                <p>We appreciate your understanding and encourage you to attend the tournament as a spectator. Tickets are available on our website.</p>
            </div>
            <div class="footer">
                <p>Kenya Open Golf Limited | Nairobi, Kenya</p>
                <p>info@magicalkenyaopen.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    Dear {user_name},
    
    Thank you for your interest in the Magical Kenya Open 2026.
    
    After careful review, we regret to inform you that we are unable to approve your registration as {role.replace('_', ' ').title()} at this time.
    
    This may be due to limited availability or incomplete documentation. If you believe this was an error or would like more information, please contact our team.
    
    We appreciate your understanding and encourage you to attend the tournament as a spectator.
    
    ---
    Kenya Open Golf Limited
    info@magicalkenyaopen.com
    """
    
    return await send_email(user_email, subject, html_content, plain_content)

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
async def approve_user(request: Request, user_id: str, background_tasks: BackgroundTasks):
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
    
    # Send approval email in background
    background_tasks.add_task(
        send_approval_email,
        user_doc.get("email"),
        user_doc.get("name", "User"),
        requested_role
    )
    
    return {"message": "User approved successfully"}

@api_router.put("/admin/users/{user_id}/reject")
async def reject_user(request: Request, user_id: str, background_tasks: BackgroundTasks):
    """Reject user role request (admin only)"""
    await require_admin(request)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    requested_role = user_doc.get("requested_role", UserRole.PUBLIC.value)
    
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
    
    # Send rejection email in background
    background_tasks.add_task(
        send_rejection_email,
        user_doc.get("email"),
        user_doc.get("name", "User"),
        requested_role
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
        # Return default info - 2026 event at Karen Country Club
        return {
            "name": "Magical Kenya Open",
            "year": 2026,
            "dates": "February 19-22, 2026",
            "venue": "Karen Country Club",
            "location": "Nairobi, Kenya",
            "purse": "$2,000,000",
            "defending_champion": "Guido Migliozzi",
            "course_par": 72,
            "course_yards": 6818
        }
    return info

@api_router.get("/tournament/schedule")
async def get_tournament_schedule():
    """Get tournament schedule"""
    schedule = await db.tournament_schedule.find({}, {"_id": 0}).to_list(100)
    if not schedule:
        return [
            {"day": "Thursday", "date": "February 19", "event": "Round 1", "time": "07:00 - 18:00"},
            {"day": "Friday", "date": "February 20", "event": "Round 2", "time": "07:00 - 18:00"},
            {"day": "Saturday", "date": "February 21", "event": "Round 3", "time": "08:00 - 17:00"},
            {"day": "Sunday", "date": "February 22", "event": "Final Round", "time": "08:00 - 17:00"}
        ]
    return schedule

@api_router.get("/tournament/past-winners")
async def get_past_winners():
    """Get past tournament winners"""
    winners = await db.past_winners.find({}, {"_id": 0}).sort("year", -1).to_list(100)
    if not winners:
        return [
            {"year": 2025, "winner": "TBD", "country": "", "score": ""},
            {"year": 2024, "winner": "Guido Migliozzi", "country": "Italy", "score": "-17"},
            {"year": 2023, "winner": "Ewen Ferguson", "country": "Scotland", "score": "-21"},
            {"year": 2022, "winner": "Justin Harding", "country": "South Africa", "score": "-16"},
            {"year": 2021, "winner": "Justin Harding", "country": "South Africa", "score": "-21"},
            {"year": 2020, "winner": "Cancelled", "country": "", "score": ""},
            {"year": 2019, "winner": "Guido Migliozzi", "country": "Italy", "score": "-22"}
        ]
    return winners

# ===================== IMAGE UPLOAD =====================
@api_router.post("/admin/upload")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Upload image file (admin only)"""
    await require_admin(request)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, WebP allowed.")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Return URL
    return {
        "filename": filename,
        "url": f"/api/uploads/{filename}",
        "content_type": file.content_type
    }

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)

@api_router.get("/admin/uploads")
async def list_uploads(request: Request):
    """List all uploaded files (admin only)"""
    await require_admin(request)
    
    files = []
    for f in UPLOAD_DIR.iterdir():
        if f.is_file():
            files.append({
                "filename": f.name,
                "url": f"/api/uploads/{f.name}",
                "size": f.stat().st_size,
                "created": datetime.fromtimestamp(f.stat().st_ctime, tz=timezone.utc).isoformat()
            })
    
    return sorted(files, key=lambda x: x["created"], reverse=True)

@api_router.delete("/admin/uploads/{filename}")
async def delete_upload(request: Request, filename: str):
    """Delete uploaded file (admin only)"""
    await require_admin(request)
    
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    filepath.unlink()
    return {"message": "File deleted successfully"}

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
