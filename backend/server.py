from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
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
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import shutil
import bcrypt
import secrets
import io
import csv

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

# ===================== VOLUNTEER MODELS =====================
class VolunteerAvailability(str, Enum):
    ALL_DAY = "all_day"
    MORNING = "morning"
    AFTERNOON = "afternoon"
    NOT_AVAILABLE = "not_available"

class VolunteerRole(str, Enum):
    MARSHAL = "marshal"
    SCORER = "scorer"

class VolunteerStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class VolunteerRegistration(BaseModel):
    volunteer_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    nationality: str
    identification_number: str
    golf_club: Optional[str] = None
    email: str
    phone: str
    role: VolunteerRole
    volunteered_before: bool = False
    availability_thursday: VolunteerAvailability = VolunteerAvailability.NOT_AVAILABLE
    availability_friday: VolunteerAvailability = VolunteerAvailability.NOT_AVAILABLE
    availability_saturday: VolunteerAvailability = VolunteerAvailability.NOT_AVAILABLE
    availability_sunday: VolunteerAvailability = VolunteerAvailability.NOT_AVAILABLE
    photo_attached: bool = False
    consent_given: bool = False
    status: VolunteerStatus = VolunteerStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    # Assignment fields
    assigned_location: Optional[str] = None
    assigned_supervisor: Optional[str] = None
    assigned_shifts: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class VolunteerRegistrationCreate(BaseModel):
    first_name: str
    last_name: str
    nationality: str
    identification_number: str
    golf_club: str  # Made mandatory
    email: str
    phone: str
    role: str
    volunteered_before: bool = False
    availability_thursday: str = "not_available"
    availability_friday: str = "not_available"
    availability_saturday: str = "not_available"
    availability_sunday: str = "not_available"
    photo_attached: bool = False
    consent_given: bool = True

class VolunteerUpdate(BaseModel):
    status: Optional[str] = None
    assigned_location: Optional[str] = None
    assigned_supervisor: Optional[str] = None
    assigned_shifts: Optional[List[str]] = None
    notes: Optional[str] = None

# ===================== MARSHAL AUTH MODELS =====================
class MarshalRole(str, Enum):
    CHIEF_MARSHAL = "chief_marshal"
    TOURNAMENT_DIRECTOR = "tournament_director"
    OPERATIONS_MANAGER = "operations_manager"
    AREA_SUPERVISOR = "area_supervisor"
    ADMIN = "admin"
    COORDINATOR = "coordinator"
    VIEWER = "viewer"

class MarshalUser(BaseModel):
    marshal_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    full_name: str
    role: MarshalRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class MarshalUserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str

class MarshalUserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # Optional password reset

class MarshalLogin(BaseModel):
    username: str
    password: str

class MarshalSession(BaseModel):
    session_id: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    marshal_id: str
    username: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=8))

# ===================== ATTENDANCE MODELS =====================
class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"

class AttendanceRecord(BaseModel):
    attendance_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    volunteer_id: str
    date: str  # YYYY-MM-DD format
    status: AttendanceStatus
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    marked_by: str  # marshal_id who marked
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# ===================== POLICY DOCUMENTS =====================
class PolicyDocument(BaseModel):
    policy_id: str = Field(default_factory=lambda: f"policy_{uuid.uuid4().hex[:12]}")
    title: str
    description: str
    filename: str
    file_url: str
    category: str = "general"  # governance, compliance, conduct, other
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

@api_router.post("/admin/policies/upload")
async def upload_policy(request: Request, file: UploadFile = File(...), title: str = "", description: str = "", category: str = "general"):
    """Upload policy PDF document (admin only)"""
    await require_admin(request)
    
    # Validate file type
    allowed_types = ["application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files allowed.")
    
    # Generate unique filename
    original_name = file.filename.replace(" ", "_")
    filename = f"{uuid.uuid4().hex[:8]}_{original_name}"
    filepath = POLICIES_DIR / filename
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Create policy record
    policy = PolicyDocument(
        title=title or file.filename.replace(".pdf", "").replace("_", " "),
        description=description,
        filename=filename,
        file_url=f"/api/policies/{filename}",
        category=category
    )
    
    policy_dict = policy.model_dump()
    policy_dict["created_at"] = policy_dict["created_at"].isoformat()
    await db.policies.insert_one(policy_dict)
    
    return {
        "policy_id": policy.policy_id,
        "filename": filename,
        "url": f"/api/policies/{filename}",
        "title": policy.title
    }

@api_router.get("/policies")
async def list_policies(category: Optional[str] = None):
    """List all active policy documents"""
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    policies = await db.policies.find(query, {"_id": 0}).to_list(100)
    return policies

@api_router.get("/policies/{filename}")
async def get_policy_file(filename: str):
    """Serve policy PDF files"""
    filepath = POLICIES_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath, media_type="application/pdf", filename=filename)

@api_router.get("/admin/policies")
async def admin_list_policies(request: Request):
    """List all policy documents (admin only)"""
    await require_admin(request)
    
    policies = await db.policies.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return policies

@api_router.delete("/admin/policies/{policy_id}")
async def delete_policy(request: Request, policy_id: str):
    """Delete policy document (admin only)"""
    await require_admin(request)
    
    policy = await db.policies.find_one({"policy_id": policy_id}, {"_id": 0})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Delete file
    filepath = POLICIES_DIR / policy["filename"]
    if filepath.exists():
        filepath.unlink()
    
    # Delete record
    await db.policies.delete_one({"policy_id": policy_id})
    return {"message": "Policy deleted successfully"}

@api_router.put("/admin/policies/{policy_id}")
async def update_policy(request: Request, policy_id: str, update: dict):
    """Update policy document metadata (admin only)"""
    await require_admin(request)
    
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.policies.update_one({"policy_id": policy_id}, {"$set": update})
    return {"message": "Policy updated successfully"}

# ===================== MARSHAL AUTH HELPERS =====================
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

async def get_marshal_session(request: Request) -> Optional[dict]:
    """Get marshal session from cookie or header"""
    session_token = request.cookies.get("marshal_session")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session = await db.marshal_sessions.find_one({"session_id": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.marshal_sessions.delete_one({"session_id": session_token})
        return None
    
    return session

async def require_marshal_auth(request: Request) -> dict:
    """Require marshal authentication"""
    session = await get_marshal_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    return session

async def require_marshal_role(request: Request, allowed_roles: List[str]) -> dict:
    """Require specific marshal roles"""
    session = await require_marshal_auth(request)
    if session["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return session

# ===================== VOLUNTEER REGISTRATION APIs =====================
@api_router.post("/volunteers/register")
async def register_volunteer(volunteer: VolunteerRegistrationCreate):
    """Public endpoint for volunteer registration"""
    # Check if email already registered
    existing = await db.volunteers.find_one({"email": volunteer.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check consent
    if not volunteer.consent_given:
        raise HTTPException(status_code=400, detail="Consent is required")
    
    # Check role quotas
    if volunteer.role == "scorer":
        scorer_count = await db.volunteers.count_documents({"role": "scorer", "status": {"$ne": "rejected"}})
        if scorer_count >= 60:
            raise HTTPException(status_code=400, detail="Scorer positions are full (max 60)")
    
    # Create volunteer record
    vol_data = {
        "volunteer_id": str(uuid.uuid4()),
        "first_name": volunteer.first_name,
        "last_name": volunteer.last_name,
        "nationality": volunteer.nationality,
        "identification_number": volunteer.identification_number,
        "golf_club": volunteer.golf_club,
        "email": volunteer.email,
        "phone": volunteer.phone,
        "role": volunteer.role,
        "volunteered_before": volunteer.volunteered_before,
        "availability_thursday": volunteer.availability_thursday,
        "availability_friday": volunteer.availability_friday,
        "availability_saturday": volunteer.availability_saturday,
        "availability_sunday": volunteer.availability_sunday,
        "photo_attached": volunteer.photo_attached,
        "consent_given": volunteer.consent_given,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
        "assigned_location": None,
        "assigned_supervisor": None,
        "assigned_shifts": [],
        "notes": None
    }
    
    await db.volunteers.insert_one(vol_data)
    
    return {
        "success": True,
        "message": "Registration submitted successfully. You will be notified once reviewed.",
        "volunteer_id": vol_data["volunteer_id"]
    }

@api_router.get("/volunteers/stats")
async def get_volunteer_stats():
    """Get volunteer registration statistics (public)"""
    marshal_count = await db.volunteers.count_documents({"role": "marshal", "status": {"$ne": "rejected"}})
    scorer_count = await db.volunteers.count_documents({"role": "scorer", "status": {"$ne": "rejected"}})
    
    return {
        "marshals": {"current": marshal_count, "minimum": 150},
        "scorers": {"current": scorer_count, "maximum": 60}
    }

# ===================== MARSHAL AUTH APIs =====================
@api_router.post("/marshal/login")
async def marshal_login(credentials: MarshalLogin, response: Response):
    """Marshal dashboard login"""
    user = await db.marshal_users.find_one({"username": credentials.username}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    # Create session
    session_id = secrets.token_urlsafe(32)
    session_data = {
        "session_id": session_id,
        "marshal_id": user["marshal_id"],
        "username": user["username"],
        "full_name": user["full_name"],
        "role": user["role"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    }
    
    await db.marshal_sessions.insert_one(session_data)
    
    # Update last login
    await db.marshal_users.update_one(
        {"marshal_id": user["marshal_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Set cookie
    response.set_cookie(
        key="marshal_session",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=8 * 60 * 60  # 8 hours
    )
    
    return {
        "success": True,
        "session_id": session_id,
        "user": {
            "marshal_id": user["marshal_id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@api_router.post("/marshal/logout")
async def marshal_logout(request: Request, response: Response):
    """Marshal dashboard logout"""
    session_token = request.cookies.get("marshal_session")
    if session_token:
        await db.marshal_sessions.delete_one({"session_id": session_token})
    
    response.delete_cookie("marshal_session")
    return {"success": True, "message": "Logged out successfully"}

@api_router.get("/marshal/me")
async def get_marshal_profile(request: Request):
    """Get current marshal user profile"""
    session = await get_marshal_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "marshal_id": session["marshal_id"],
        "username": session["username"],
        "full_name": session["full_name"],
        "role": session["role"]
    }

# ===================== MARSHAL DASHBOARD APIs =====================
@api_router.get("/marshal/volunteers")
async def get_all_volunteers(
    request: Request,
    status: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all volunteers (marshal dashboard)"""
    await require_marshal_auth(request)
    
    query = {}
    if status:
        query["status"] = status
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    volunteers = await db.volunteers.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return volunteers

@api_router.get("/marshal/volunteers/{volunteer_id}")
async def get_volunteer_details(request: Request, volunteer_id: str):
    """Get specific volunteer details"""
    await require_marshal_auth(request)
    
    volunteer = await db.volunteers.find_one({"volunteer_id": volunteer_id}, {"_id": 0})
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Get attendance records
    attendance = await db.volunteer_attendance.find(
        {"volunteer_id": volunteer_id}, {"_id": 0}
    ).sort("date", 1).to_list(100)
    
    volunteer["attendance_records"] = attendance
    return volunteer

@api_router.put("/marshal/volunteers/{volunteer_id}")
async def update_volunteer(request: Request, volunteer_id: str, update: VolunteerUpdate):
    """Update volunteer record"""
    session = await require_marshal_role(request, ["chief_marshal", "admin"])
    
    volunteer = await db.volunteers.find_one({"volunteer_id": volunteer_id}, {"_id": 0})
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.volunteers.update_one({"volunteer_id": volunteer_id}, {"$set": update_data})
    return {"success": True, "message": "Volunteer updated successfully"}

@api_router.post("/marshal/volunteers/{volunteer_id}/approve")
async def approve_volunteer(request: Request, volunteer_id: str):
    """Approve volunteer"""
    session = await require_marshal_role(request, ["chief_marshal", "admin"])
    
    result = await db.volunteers.update_one(
        {"volunteer_id": volunteer_id},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    return {"success": True, "message": "Volunteer approved"}

@api_router.post("/marshal/volunteers/{volunteer_id}/reject")
async def reject_volunteer(request: Request, volunteer_id: str):
    """Reject volunteer"""
    session = await require_marshal_role(request, ["chief_marshal", "admin"])
    
    result = await db.volunteers.update_one(
        {"volunteer_id": volunteer_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    return {"success": True, "message": "Volunteer rejected"}

# ===================== ATTENDANCE APIs =====================
@api_router.post("/marshal/attendance")
async def mark_attendance(request: Request, attendance: dict):
    """Mark volunteer attendance"""
    session = await require_marshal_role(request, ["chief_marshal", "area_supervisor", "admin"])
    
    volunteer_id = attendance.get("volunteer_id")
    date = attendance.get("date")  # YYYY-MM-DD
    status = attendance.get("status")  # present, absent, late
    
    if not all([volunteer_id, date, status]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Check if volunteer exists
    volunteer = await db.volunteers.find_one({"volunteer_id": volunteer_id}, {"_id": 0})
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Upsert attendance record
    attendance_data = {
        "attendance_id": str(uuid.uuid4()),
        "volunteer_id": volunteer_id,
        "date": date,
        "status": status,
        "check_in_time": attendance.get("check_in_time"),
        "check_out_time": attendance.get("check_out_time"),
        "marked_by": session["marshal_id"],
        "notes": attendance.get("notes"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.volunteer_attendance.update_one(
        {"volunteer_id": volunteer_id, "date": date},
        {"$set": attendance_data},
        upsert=True
    )
    
    return {"success": True, "message": "Attendance marked"}

@api_router.get("/marshal/attendance/{date}")
async def get_attendance_by_date(request: Request, date: str):
    """Get attendance for a specific date"""
    await require_marshal_auth(request)
    
    # Get all volunteers with their attendance for this date
    volunteers = await db.volunteers.find(
        {"status": "approved"}, {"_id": 0}
    ).to_list(1000)
    
    attendance_records = await db.volunteer_attendance.find(
        {"date": date}, {"_id": 0}
    ).to_list(1000)
    
    attendance_map = {a["volunteer_id"]: a for a in attendance_records}
    
    result = []
    for vol in volunteers:
        att = attendance_map.get(vol["volunteer_id"], {})
        result.append({
            **vol,
            "attendance_status": att.get("status"),
            "check_in_time": att.get("check_in_time"),
            "check_out_time": att.get("check_out_time")
        })
    
    return result

# ===================== MARSHAL USER MANAGEMENT =====================
@api_router.post("/marshal/users")
async def create_marshal_user(request: Request, user: MarshalUserCreate):
    """Create marshal user (chief marshal only)"""
    session = await require_marshal_role(request, ["chief_marshal"])
    
    # Check if username exists
    existing = await db.marshal_users.find_one({"username": user.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_data = {
        "marshal_id": str(uuid.uuid4()),
        "username": user.username,
        "password_hash": hash_password(user.password),
        "full_name": user.full_name,
        "role": user.role,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    }
    
    await db.marshal_users.insert_one(user_data)
    
    return {
        "success": True,
        "marshal_id": user_data["marshal_id"],
        "message": "User created successfully"
    }

@api_router.get("/marshal/users")
async def list_marshal_users(request: Request):
    """List all marshal users (chief marshal only)"""
    await require_marshal_role(request, ["chief_marshal"])
    
    users = await db.marshal_users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return users

@api_router.delete("/marshal/users/{marshal_id}")
async def delete_marshal_user(request: Request, marshal_id: str):
    """Delete marshal user (chief marshal only)"""
    session = await require_marshal_role(request, ["chief_marshal"])
    
    # Can't delete yourself
    if marshal_id == session["marshal_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    await db.marshal_users.delete_one({"marshal_id": marshal_id})
    await db.marshal_sessions.delete_many({"marshal_id": marshal_id})
    
    return {"success": True, "message": "User deleted"}

# ===================== EXPORT APIs =====================
@api_router.get("/marshal/export/volunteers")
async def export_volunteers(request: Request, format: str = "csv"):
    """Export volunteer list to CSV"""
    await require_marshal_auth(request)
    
    volunteers = await db.volunteers.find({}, {"_id": 0}).to_list(1000)
    
    if format == "csv":
        output = io.StringIO()
        if volunteers:
            writer = csv.DictWriter(output, fieldnames=volunteers[0].keys())
            writer.writeheader()
            writer.writerows(volunteers)
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=volunteers.csv"}
        )
    
    return volunteers

@api_router.get("/marshal/export/attendance/{date}")
async def export_attendance(request: Request, date: str):
    """Export attendance for a specific date"""
    await require_marshal_auth(request)
    
    attendance_data = await get_attendance_by_date(request, date)
    
    output = io.StringIO()
    if attendance_data:
        fieldnames = ["first_name", "last_name", "role", "assigned_location", "attendance_status", "check_in_time", "check_out_time"]
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(attendance_data)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_{date}.csv"}
    )

@api_router.get("/marshal/stats")
async def get_marshal_dashboard_stats(request: Request):
    """Get dashboard statistics"""
    await require_marshal_auth(request)
    
    total_volunteers = await db.volunteers.count_documents({})
    pending = await db.volunteers.count_documents({"status": "pending"})
    approved = await db.volunteers.count_documents({"status": "approved"})
    rejected = await db.volunteers.count_documents({"status": "rejected"})
    marshals = await db.volunteers.count_documents({"role": "marshal", "status": {"$ne": "rejected"}})
    scorers = await db.volunteers.count_documents({"role": "scorer", "status": {"$ne": "rejected"}})
    
    return {
        "total": total_volunteers,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "by_role": {
            "marshals": marshals,
            "scorers": scorers
        },
        "quotas": {
            "marshals_minimum": 150,
            "scorers_maximum": 60
        }
    }

# ===================== SEED DEFAULT CHIEF MARSHAL =====================
async def seed_chief_marshal():
    """Create default chief marshal account if none exists"""
    existing = await db.marshal_users.find_one({"role": "chief_marshal"}, {"_id": 0})
    if not existing:
        default_user = {
            "marshal_id": str(uuid.uuid4()),
            "username": "chiefmarshal",
            "password_hash": hash_password("MKO2026Admin!"),
            "full_name": "Chief Marshal",
            "role": "chief_marshal",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }
        await db.marshal_users.insert_one(default_user)
        logger.info("Default chief marshal account created: username='chiefmarshal', password='MKO2026Admin!'")

@app.on_event("startup")
async def startup_event():
    """Run on app startup"""
    await seed_chief_marshal()

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
