# CrimNet Analyzer — AI-Powered Criminal Network Analysis System

An intelligence analysis platform for NCRB / law enforcement that ingests FIRs, CDRs, financial transaction records, and surveillance reports — then extracts entities via NLP, builds a criminal relationship graph, identifies key influencers, and detects suspicious patterns.

## 🏗️ Architecture

```
crimnet-analyzer/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── engines/      # NLP extraction, graph builder, pattern detector
│   │   ├── models/       # Mongoose schemas (Case, Entity, Relationship, Pattern, User, DataSource)
│   │   ├── routes/       # REST API endpoints (auth, cases)
│   │   ├── middleware/   # JWT auth middleware
│   │   ├── server.js     # Express entry point
│   │   └── seed.js       # Demo data seeder
│   └── package.json
├── frontend/             # React (Vite) SPA
│   ├── src/
│   │   ├── pages/        # Dashboard, Network, Entities, Patterns, Upload, Login
│   │   ├── components/   # Layout, shared components
│   │   ├── api.js        # Axios client
│   │   └── index.css     # Clay design system
│   └── package.json
├── DESIGN.md             # Clay design system tokens
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **MongoDB** running locally on port 27017 (default)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Seed the database

This loads sample FIR narratives, CDR records, and financial transactions, then runs entity extraction, graph building, centrality analysis, and pattern detection:

```bash
cd backend
npm run seed
```

You should see output showing extracted entities, top influencers, and detected suspicious patterns.

### 3. Start the backend

```bash
cd backend
npm run dev
```

Server starts on `http://localhost:5000`

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

Frontend starts on `http://localhost:5173` with API proxy to backend.

### 5. Login

Open `http://localhost:5173` and use:

| Role         | Username       | Password    |
|-------------|---------------|-------------|
| Admin       | `admin`       | `admin123`  |
| Investigator| `investigator`| `invest123` |

## 📋 Core Features

### Data Ingestion
- Upload FIR narrative text for NLP entity extraction
- Upload CDR CSV (caller, callee, timestamp, duration, tower_id)
- Upload Financial CSV (sender/receiver accounts, names, amounts)

### Entity Extraction (NLP)
- **compromise.js** for person names, organizations, locations
- **Regex patterns** for phone numbers, vehicle registrations, account numbers
- **Fuzzy deduplication** via string-similarity (e.g., "Rahul K." → "Rahul Kumar")

### Graph Analytics
- **graphology** in-memory graph with nodes (entities) and edges (relationships)
- **Degree Centrality** — number of connections
- **Betweenness Centrality** — bridge/broker importance
- **PageRank** — recursive influence measure
- Composite **Influence Score** ranking

### Suspicious Pattern Detection
| Pattern | Description |
|---------|-------------|
| Call Frequency Spike | Unusually high call volume between two numbers |
| Circular Transaction | Triangular money flow (A→B→C→A) suggesting layering |
| Burner Phone | High-volume calls across many contacts |
| High-Value Transfer | Large financial transfers (₹5L+) |
| Rapid Transactions | Multiple transactions within a short time window |

### Visualization
- **Interactive force-directed graph** — nodes colored/sized by type & influence
- **Dashboard** — stat cards, influencer bar chart, entity type pie chart
- **Entity table** — searchable, filterable, sortable with progress bars
- **Pattern alerts** — severity-filtered with evidence details

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Investigator login |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/cases` | List all cases |
| POST | `/api/cases` | Create a case |
| GET | `/api/cases/:id` | Get case details |
| POST | `/api/cases/:id/upload` | Upload data (file or text) |
| GET | `/api/cases/:id/entities` | List extracted entities |
| GET | `/api/cases/:id/network` | Get graph (nodes + edges) |
| GET | `/api/cases/:id/influencers` | Ranked key individuals |
| GET | `/api/cases/:id/patterns` | Suspicious pattern alerts |
| GET | `/api/cases/:id/stats` | Dashboard statistics |
| POST | `/api/cases/:id/analyze` | Re-run analysis |

## 🔧 Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/criminal_network
JWT_SECRET=ncrb_criminal_network_secret_key_2024
JWT_EXPIRES_IN=24h
```

## 🎨 Design System

Uses the **Clay design system** (see `DESIGN.md`) with:
- Cream canvas (#fffaf0) background
- Dark sidebar navigation
- Saturated brand-color stat cards (pink, teal, lavender, peach, ochre, coral)
- Inter font family, generous border radius
- Smooth animations and micro-interactions

## 📊 Sample Data (Seed)

The seed script creates a demo case **"Operation Shadownet"** with:
- **4 FIR narratives** describing a drug trafficking, extortion, money laundering, and arms supply network
- **30 CDR records** among 12 phone numbers
- **18 financial transactions** among 5 account holders
- Automatic extraction of **30+ entities** (persons, phones, locations, vehicles, accounts, organizations)
- **50+ relationships** (calls, financial, co-occurrence)
- **Multiple detected patterns** including circular transactions and call frequency spikes
- **Ranked influencers** with Deepak Malhotra identified as the key network leader

## License

For educational/demonstration purposes only.
