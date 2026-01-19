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
