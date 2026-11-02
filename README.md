# Full-Stack Website Replica (UI/UX & Animations Exact Clone)

Exact 1:1 replica of [edudhani.com](https://edudhani.com) with a decoupled **Frontend** running on **Port 4000** and a **Backend API** running on **Port 5000**.

---

## 🚀 Running the Project

Both servers are currently running and ready to test:

| Service | Address | Description |
| :--- | :--- | :--- |
| **Frontend** | **[http://localhost:4000](http://localhost:4000)** | Full website with all physics, 3D doors, flip-calendar, rope cord, cards & rooms |
| **Backend API** | **[http://localhost:5000](http://localhost:5000)** | REST API for contact inquiries, status checks, stats & config |

### Start Command (Runs Both Together)
```bash
cd "C:\Users\neera\.gemini\antigravity\scratch\Dhani Tech"
npm start
```

### Or Start Individually
```bash
# Frontend only (Port 4000)
npm run start:frontend

# Backend only (Port 5000)
npm run start:backend
```

---

## 🛠️ Backend API Endpoints (`:5000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and uptime |
| `GET` | `/api/status` | Availability status, response time, and timezone |
| `GET` | `/api/config` | Portfolio profile metadata |
| `PUT` | `/api/config` | Update portfolio profile metadata |
| `POST`| `/api/contact` | Submits project inquiry form (persists to `backend/data/inquiries.json`) |
| `GET` | `/api/inquiries` | Retrieve list of all visitor inquiries |
| `DELETE` | `/api/inquiries/:id` | Delete an inquiry by ID |
| `GET` | `/api/stats` | Site analytics (visit count, inquiry count) |
| `POST`| `/api/stats/visit` | Track a page view |

---

## 📁 Architecture Overview

```
Dhani Tech/
├── start.js                     # Root process orchestrator (runs :4000 and :5000 together)
├── package.json                 # Monorepo scripts
├── README.md                    # Architecture and documentation
│
├── backend/                     # Node.js + Express API (Port 5000)
│   ├── server.js                # REST API, CORS, JSON file persistence
│   ├── package.json             # Express & CORS dependencies
│   └── data/
│       ├── inquiries.json       # Persisted visitor messages & contact forms
│       ├── config.json          # Portfolio configuration & availability status
│       └── stats.json           # Site analytics & visit counters
│
└── frontend/                    # Client static application (Port 4000)
    ├── server.js                # Static streaming server with /api proxy to :5000
    ├── package.json             # Frontend server scripts
    ├── index.html               # Main page with flip calendar, 3D card, doors & story
    ├── fonts/                   # Onest Latin font files
    ├── vendor/                  # Lenis smooth scroll engine
    ├── card/                    # 3D interactive holographic card assets
    ├── web-developer/           # Web developer room (case studies & videos)
    ├── app-developer/           # App developer room (iOS showcase & screen recordings)
    ├── ui-ux-designer/          # UI/UX designer room (flows & prototypes)
    ├── graphic-designer/        # Graphic designer room (branding & posters)
    ├── photographer/            # Photography room (photos.js + 56 gallery photos)
    └── legal/                   # Legal & terms of service
```

---

## 🎯 Frontend & Backend Integration

- When visitors submit the inquiry modal (`#reqForm`) on **http://localhost:4000**, the submission is posted directly through the frontend's built-in API proxy to **http://localhost:5000/api/contact**.
- The backend validates the submission and saves it to `backend/data/inquiries.json`.
- The frontend immediately displays the native `"Message sent"` success confirmation.
- If the backend is ever offline, the form gracefully falls back to opening the visitor's default email client (`mailto:`).
