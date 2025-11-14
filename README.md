# MentorMatch

MentorMatch pairs students and professionals based on hobbies and skills. Backend: Django + DRF. Frontend: React.

## Features

Sign up as a student or professional
Create profile with skills and hobbies
Professional verification workflow
Swipe interface to match based on shared interests
Chat with matches
Django admin interface for managing users and verifications

## Architecture Overview

Backend: Django + Django REST Framework (DRF)

- Auth: Simple JWT (access/refresh tokens)
- Apps: single `api` app containing models, serializers, views, and URLs
- Media: user uploads stored under `MEDIA_ROOT` (e.g., `user_media/`, `verifications/`)
- CORS: `django-cors-headers` enabled for local dev
- Frontend: React + Vite
  - Routing: React Router v6
  - HTTP: Axios wrapper in `src/api.js` with optional Bearer token
  - UI: Lightweight CSS with CSS variables and dark mode via `data-theme`

### Folder Structure

```
mentormatch/
├─ mentormatch_backend/
│  ├─ api/
│  │  ├─ models.py          # Data models (User, Skill, Swipe, Match, Message, Media, VerificationRequest)
│  │  ├─ serializers.py     # DRF serializers (validation + shape control)
│  │  ├─ views.py           # REST endpoints (register, profile, matching, media, messages)
│  │  ├─ urls.py            # API URL routes
│  │  └─ management/commands/populate_users.py # Test data generator (CSV output)
│  ├─ settings.py           # Django settings (DEBUG, CORS, installed apps)
│  └─ ...
├─ mentormatch_frontend/
│  └─ src/
│     ├─ App.jsx            # Routes + top navigation
│     ├─ api.js             # Axios client + API base
│     ├─ utils/errors.js    # Error formatting & logging helpers
│     └─ pages/
│        ├─ SignIn.jsx      # Login (JWT retrieval)
│        ├─ SignUp.jsx      # Registration
│        ├─ Swipe.jsx       # Potential matches and swipes
│        ├─ Matches.jsx     # Mutual likes list
│        ├─ MyProfile.jsx   # Profile editor + media upload
│        └─ Settings.jsx    # Privacy + theme + account deletion
└─ test_user_credentials.csv # Generated test accounts (if seeding ran)
```

### Data Model Highlights

- User extends `AbstractUser` with:
  - Role: `student` or `professional`
  - Skills offered / needed: many-to-many `Skill`
  - Hobbies: many-to-many `Hobby`
  - Privacy flags: `show_phone`, `show_email`, `show_age`
  - Verification: `is_verified`, `verification_document`, `VerificationRequest`
  - Deletion scheduling: timestamp for 7-day cooling-off
- Swipe: one-direction interest (`from_user` → `to_user`, unique pair)
- Match: created on mutual like (unique per pair)
- Message: chat content tied to a `Match`
- Media: user-uploaded files (image/video/file) visible to owner + matches

### Matching Algorithm (Summary)

- Inputs: overlap between a candidate's skills offered/needed and the current user's needed/offered.
- Scoring: weighted blend of Jaccard similarities and synergy, plus a small bonus for verified users; result clamped to 0–100.
- Case-insensitive: skill names are normalized to lowercase during scoring.
- Filters: optional query params (`offered`, `needed`, `global`) adjust candidate list before scoring.

### Test Data Seeding

Use the management command to create 50 students + 50 professionals with random attributes and a CSV of credentials:

```bash
cd mentormatch_backend
python manage.py populate_users --count 50
```

Outputs `test_user_credentials.csv` at the repo root for quick logins.

## Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- Git

## Running the Project Locally

### Backend (Django)

1. Create and activate a Python virtual environment:

```bash
cd mentormatch_backend
python -m venv ../.venv
source ../.venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Apply database migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

4. Create a superuser (for admin access):

```bash
python manage.py createsuperuser
# Or use these default dev credentials:
# username: admin
# email: admin@example.com
# password: adminpass
```

5. Start the Django development server:

```bash
python manage.py runserver 8000
```

The backend will be available at:

- API: http://127.0.0.1:8000/api/
- Admin interface: http://127.0.0.1:8000/admin/

### Frontend (React + Vite)

1. Install frontend dependencies:

```bash
cd mentormatch_frontend
npm install
```

2. Start the Vite development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:5173 (or the URL shown in your terminal).

## Development Workflow

1. Log in to Django admin (http://127.0.0.1:8000/admin/) to:

   - Review and approve professional verification requests
   - Manage users, matches, and messages
   - View system activity

2. Create test accounts:
   - Sign up a student user
   - Sign up a professional user
   - Add skills and hobbies to profiles
   - For professionals: upload verification documents
   - Use the Swipe interface to create matches
   - Test messaging between matched users

## API Endpoints & Testing

All endpoints are under `/api/`. Here are curl commands to test each endpoint:

### Authentication

1. Register a new user:

```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_student",
    "email": "john@example.com",
    "password": "securepass123",
    "password2": "securepass123",
    "role": "student"
  }'
```

2. Get JWT tokens:

```bash
# Login and get tokens
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_student",
    "password": "securepass123"
  }'

# Save token for later requests
export TOKEN="eyJ0..." # Replace with your access token
```

### Profile Management

1. Update profile (including skills and hobbies):

```bash
curl -X PATCH http://localhost:8000/api/profile/update/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "male",
    "bio": "CS student who loves tennis",
    "skill_ids": ["python", "java"],
    "hobby_ids": ["tennis", "chess"]
  }'
```

2. Upload verification document (for professionals):

```bash
curl -X PATCH http://localhost:8000/api/profile/update/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "verification_document=@/path/to/document.pdf"
```

### Matching & Swipes

1. Get potential matches:

```bash
curl -X GET http://localhost:8000/api/potential/ \
  -H "Authorization: Bearer $TOKEN"
```

2. Record a swipe:

```bash
curl -X POST http://localhost:8000/api/swipe/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user": 123,
    "liked": true
  }'
```

3. List matches:

```bash
curl -X GET http://localhost:8000/api/matches/ \
  -H "Authorization: Bearer $TOKEN"
```

### Messaging

1. Get messages for a match:

```bash
curl -X GET http://localhost:8000/api/messages/1/ \
  -H "Authorization: Bearer $TOKEN"
```

2. Send a message:

```bash
curl -X POST http://localhost:8000/api/messages/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "match": 1,
    "content": "Hey, when would you like to play tennis?"
  }'
```

### Response Examples

Successful registration:

```json
{
  "id": 1,
  "username": "john_student",
  "email": "john@example.com",
  "role": "student"
}
```

JWT tokens:

```json
{
  "access": "eyJ0...",
  "refresh": "eyJ1..."
}
```

Potential match:

```json
[
  {
    "user": {
      "id": 2,
      "username": "jane_pro",
      "role": "professional",
      "bio": "Tennis coach & software engineer",
      "skills": ["python", "java"],
      "hobbies": ["tennis"]
    },
    "score": 85
  }
]
```

Match created (after mutual like):

```json
{
  "matched": true,
  "match": {
    "id": 1,
    "user1": { "username": "john_student" },
    "user2": { "username": "jane_pro" },
    "timestamp": "2025-11-09T08:00:00Z"
  }
}
```

## Troubleshooting

### Backend Issues

If port 8000 is already in use:

```bash
# Find process using port 8000
lsof -nP -iTCP:8000 -sTCP:LISTEN
# Kill the process (replace <PID>)
kill <PID>
# Or start Django on different port
python manage.py runserver 8001
```

If you see migration errors:

```bash
# Remove development database (loses all data!)
rm db.sqlite3
python manage.py makemigrations
python manage.py migrate
```

### Frontend Issues

If API calls fail:

- Ensure Django server is running
- Check API_BASE in src/api.js matches Django port
- Verify CORS settings in Django (development: CORS_ALLOW_ALL_ORIGINS = True)
- Check browser console for specific errors

If npm install fails:

- Delete node_modules and package-lock.json
- Run npm install again
- Ensure Node.js version is compatible

## Security Notes

Current settings are for development only. For production:

- Change Django SECRET_KEY
- Set DEBUG = False
- Configure proper CORS settings
- Use secure cookie storage for JWT
- Set up proper database (PostgreSQL recommended)
- Configure static/media file serving
- Add rate limiting
- Enable HTTPS
