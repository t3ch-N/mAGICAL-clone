# Magical Kenya Open - Product Requirements Document

## Original Problem Statement
Build a professional international golf tournament website and digital operations platform for the Magical Kenya Open, including public fan content, tickets and hospitality information, media and broadcast resources, and secure role-based registration modules for media, volunteers, vendors, and junior golf participants with ability for news and content (videos, photos), leaderboard etc.

## User Personas
1. **Golf Fans/Spectators** - Access leaderboard, buy tickets, view news/gallery
2. **Media/Press** - Access media resources, request accreditation
3. **Volunteers** - Register for volunteer roles
4. **Vendors** - Apply for vendor accreditation
5. **Junior Golf Participants** - Register for junior programs
6. **Admin/Organizers** - Manage content, users, leaderboard, enquiries

## Core Requirements (Static)
- Premium golf tournament website with Kenyan identity
- Live/mock leaderboard with player data
- Tickets & hospitality info with enquiry forms
- Role-based registration (Google OAuth)
- Admin dashboard for content management
- Editorial workflow (draft/review/publish)
- News & gallery sections
- Tournament information & history

## What's Been Implemented (V1 - January 2025)

### Pages Completed
- ✅ Home (hero, countdown, leaderboard preview, news, sponsors)
- ✅ Tournament (about, course, schedule, past winners tabs)
- ✅ Players & Leaderboard (live scores table, search, filtering)
- ✅ Tickets & Hospitality (packages, enquiry modal)
- ✅ Travel & Experience (hotels, attractions, tips)
- ✅ Media & Broadcast (schedule, resources, accreditation)
- ✅ Registration & Accreditation (Google OAuth, role selection)
- ✅ News & Gallery (articles, photo grid, lightbox)
- ✅ About Tournament (history, timeline, impact)
- ✅ About KOGL (organization info, partners)
- ✅ Contact (form, social links)
- ✅ Admin Dashboard (overview, users, content, leaderboard, enquiries)

### Backend APIs
- Auth (Google OAuth, session management, role requests)
- Users (CRUD, role approval workflow)
- Players & Leaderboard (CRUD with mock data)
- News/Content (create, update, publish, delete)
- Gallery (photos/videos management)
- Tickets/Packages
- Enquiries & Contact forms
- Tournament info endpoints

### Design System
- Playfair Display + Barlow Condensed + DM Sans fonts
- Kenya green (#1a472a) + Magical red (#e31937) + Safari gold (#d4af37)
- Premium photography-focused design
- Responsive mobile-first approach

## Prioritized Backlog

### P0 (Critical - Next Phase)
- Live API integration for real tournament scores
- Email notifications for registration approvals
- Image upload functionality for admin

### P1 (High Priority)
- Stripe/payment integration for tickets
- Player profile detail pages
- Video player for gallery videos
- Push notifications for score updates

### P2 (Medium Priority)
- Social sharing for news articles
- Multi-language support (Swahili)
- Dark mode toggle
- Advanced search with filters

## Tech Stack
- Frontend: React 19 + Tailwind CSS + shadcn/ui
- Backend: FastAPI + MongoDB
- Auth: Emergent Google OAuth
- Deployment: Kubernetes/Docker

## Testing Results
- Backend: 94.4% pass rate
- Frontend: 100% pass rate
- Overall: 98.2% success

## Update Log - January 2026

### Features Added (V1.1)
- ✅ **Image Upload System**: Admin can upload images via Media Library for use in news/gallery
- ✅ **2026 Tournament Update**: February 19-22, 2026 at Karen Country Club (Par 72, 6,818 yards)
- ✅ **KOGL Page Enhancement**: Added Governance, Board, Policies, Partners tabs
- ✅ **Social Media Links**: Facebook, Twitter, Instagram, YouTube, LinkedIn in footer
- ✅ **Admin Login Link**: Visible in footer for easy access

### Backend Endpoints Added
- `POST /api/admin/upload` - Upload images
- `GET /api/uploads/{filename}` - Serve uploaded files
- `GET /api/admin/uploads` - List all uploads
- `DELETE /api/admin/uploads/{filename}` - Delete upload

### Testing Results (V1.1)
- Backend: 94.4% pass rate
- Frontend: 100% pass rate
- Overall: 98.2% success

### Features Added (V1.2)
- ✅ **Email Notifications**: System ready for Gmail SMTP (add credentials to enable)
  - Sends approval email when user registration is approved
  - Sends rejection email when user registration is rejected
- ✅ **Policy Document Management**: Admin can upload/manage PDF policies
  - Upload PDFs via Admin Dashboard → Policies section
  - Policies display on public KOGL page with download links
  - Category support: Governance, Compliance, Conduct, General, Other
- ✅ **Enhanced Admin Dashboard**: 
  - Media section for image uploads
  - Policies section for PDF uploads
  - Both integrated into admin navigation

### To Enable Email Notifications
Add to `/app/backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_EMAIL=your-gmail@gmail.com
SMTP_FROM_NAME=Magical Kenya Open
```
Then restart backend: `sudo supervisorctl restart backend`

### Features Added (V1.3 - January 2025)
- ✅ **Homepage Media Carousel**: Featured content with videos, articles, gallery items
- ✅ **Player Spotlight Section**: Showcasing key players with photos
- ✅ **Venue Update**: Karen Country Club as 2026 host venue with course details
- ✅ **Kenya Experience CTA**: Promotional section for safari/tourism

### Features Added (V1.4 - January 2025)
- ✅ **Updated Sponsor Logos**: Added official sponsor images provided by user
  - Main Partner: Ministry of Youth Affairs, Creative Economy and Sports (Government of Kenya)
  - Official Partners: DP World Tour (European Tour), Magical Kenya Open
  - Tournament Sponsors: DP World (blue logo), ABSA Kenya, Johnnie Walker, SportPesa
- ✅ **Top Banner**: DP World Tour logo (left) + KOGL logo (right) - no "Official Partners" text
- ✅ **Sponsors Section Hierarchy**: Clear visual hierarchy with Main Partner, Official Partners, and Tournament Sponsors
- ✅ **KOGL Page Logo**: Added KOGL logo prominently on About KOGL page

**Important Distinction:**
- DP World Tour = European Tour organization (Magical Kenya Open is part of this tour)
- DP World = Company sponsor (appears in Tournament Sponsors section)

## Prioritized Backlog (Updated)

### P0 (Critical - Next Phase)
- ✅ ~~Update homepage sponsor logos~~ (COMPLETED)
- Email notifications (BLOCKED - waiting for user Gmail credentials)
- PDF downloads for policies (ensure download functionality works)

### P1 (High Priority)
- Live API integration for real tournament scores
- Board member photo uploads
- Player profile detail pages

### P2 (Medium Priority)
- Stripe/payment integration for tickets
- Social sharing for news articles
- Multi-language support (Swahili)
