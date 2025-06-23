# ERP System for Ethanol & Sugar Factory

## Project Overview
Solo-developed complete ERP system for ethanol and sugar factory operations with hybrid local-cloud architecture.

### Key Features
- Multi-division integrated operations (Sugar, Power, Ethanol, Animal Feed)
- Local hardware integration (weighbridge, DCS)
- Factory cane yard management
- Farmer management and payments
- Division-wise production monitoring
- Integrated resource sharing and optimization
- Cloud analytics and reporting
- AI-powered insights via MCP server

## Technology Stack

### Frontend
- **Build Tool**: Vite 6.0
- **Framework**: React 19 with TypeScript 5.6
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand/TanStack Query

### Backend
- **Local Runtime**: Bun (latest)
- **Framework**: Hono
- **ORM**: Prisma 6.0
- **Database (Local)**: MS SQL Server 2024
- **Database (Cloud)**: PostgreSQL 17 on Railway
- **Real-time**: WebSockets/Server-Sent Events

### AI Integration
- **MCP Server**: Google Workspace MCP with Gmail integration
- **LLM**: Claude 3.5 Sonnet
- **OAuth Provider**: mspil.in (Mahakaushal Sugar and Power Industries Ltd.)
- **OAuth Type**: Internal (Google Workspace)
- **Features**: 
  - Natural language queries, predictive analytics, optimization suggestions
  - Gmail integration (read/send emails, calendar management)
  - Document AI analysis (invoices, POs, offers, contracts)
  - Email attachment extraction and processing
  - Automated workflow: Email → Extract → Analyze → Store → Respond

### Infrastructure
- **Local Deployment**: Windows Server
- **Cloud Platform**: Railway
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## Development Environment
- **Development Machine**: Mac M1
- **Production Target**: Windows x64
- **IDE**: VS Code
- **Version Control**: Git

## Business Divisions
The factory operates four integrated business units sharing common infrastructure:

### 1. Sugar Division
- Sugarcane crushing and processing
- Sugar production (white/brown)
- Molasses management
- Quality control lab
- Sugar packaging and storage

### 2. Power Division
- Bagasse-based cogeneration
- Steam generation and distribution
- Power export to grid
- Internal power distribution
- Equipment maintenance

### 3. Ethanol Division
- Molasses fermentation
- Distillation process
- Ethanol storage and blending
- Quality certification
- Tanker loading system

### 4. Animal Feed Division
- Bagasse processing
- Feed formulation
- Pelletizing operations
- Packaging and storage
- Distribution management

### Shared Infrastructure
- Weighbridge (common entry point)
- Cane yard management
- Farmer management system
- Financial operations
- HR and payroll
- Maintenance workshop

## Project Structure
```
ERP/
├── apps/
│   ├── local-web/          # Vite + React frontend
│   ├── local-api/          # Bun + Hono backend
│   └── cloud-api/          # Railway-deployed services
├── packages/
│   ├── shared/             # Shared utilities and types
│   ├── database/           # Prisma schemas and migrations
│   └── mcp-tools/          # Custom MCP server tools
├── modules/
│   ├── common/             # Shared modules (weighbridge, farmers, etc.)
│   ├── sugar/              # Sugar division specific
│   ├── power/              # Power division specific
│   ├── ethanol/            # Ethanol division specific
│   └── feed/               # Animal feed division specific
├── docker/
│   ├── local/              # Local deployment containers
│   └── cloud/              # Railway deployment configs
├── scripts/                # Build and deployment scripts
└── docs/                   # Additional documentation
```

## Current Status - Phase 1 Complete! 🎉

### ✅ Infrastructure & Deployment
- [x] Monorepo setup with pnpm workspaces
- [x] Railway cloud deployment (All services running)
- [x] PostgreSQL database with complete schema (30+ tables)
- [x] Frontend (React + Vite) deployed and accessible
- [x] Cloud API (Hono + Prisma) with authentication
- [x] Docker setup for Windows deployment
- [x] GitHub repository with CI/CD

### ✅ Core Features Implemented
- [x] Multi-tenant architecture (Companies & Factories)
- [x] User authentication (Username: saif, Password: 1234)
- [x] Company setup wizard
- [x] Role-based access control (ADMIN, MANAGER, OPERATOR, VIEWER)
- [x] Master data structure for all divisions
- [x] Store module schema (Requisitions, POs, GRNs)
- [x] Finance module schema (Invoices, Payments, Banking)

### ✅ AI & MCP Features
- [x] Gmail integration with OAuth2 (Working!)
- [x] Document AI analysis (invoices, POs, contracts)
- [x] Email attachment extraction and processing
- [x] AI chat interface in frontend
- [x] Railway internal networking optimization (20x faster)
- [x] Natural language queries support
- [x] Gmail OAuth fixed - can list/send emails
- [x] Email metadata access working

### 🚀 Ready for Phase 2
- [ ] Business logic implementation
- [ ] Hardware integration (Weighbridge, DCS)
- [ ] Production tracking dashboards
- [ ] Financial operations workflows
- [ ] Real-time monitoring WebSockets

## Phase 1: Foundation (Weeks 1-2) ✅ COMPLETED
### Completed Tasks
- [x] Initialize monorepo with pnpm workspaces
- [x] Set up Vite + React + TypeScript
- [x] Configure Bun backend with Hono
- [x] Set up Prisma with MS SQL Server
- [x] Docker configuration for cross-platform
- [x] Basic authentication system
- [x] Division-specific module structure
- [x] Deployment scripts and documentation

### Key Decisions
- Monorepo structure for better code sharing
- pnpm for efficient dependency management
- Docker for consistent Windows deployment
- Modular architecture for easy maintenance

## Phase 2: Hardware Integration (Weeks 3-6)
### Planned Features
- Weighbridge serial/TCP communication
- DCS data acquisition (OPC/Modbus)
- Real-time data streaming
- Hardware status monitoring

### Implementation Notes
- Abstract hardware communication layer
- Mock hardware for development on Mac
- Windows-specific drivers in Docker

## Phase 3: Division-Specific Operations (Weeks 7-12)

### Common Modules (All Divisions)
1. **Cane Yard Management**
   - Location tracking
   - Quality parameters
   - Processing queue
   - Division-wise allocation

2. **Farmer Management**
   - Registration system
   - Contract management
   - Field tracking
   - Payment distribution

### Sugar Division
- Crushing operations monitoring
- Juice extraction tracking
- Crystallization process
- Sugar grading and bagging
- Molasses output tracking

### Power Division
- Bagasse consumption tracking
- Boiler efficiency monitoring
- Power generation metrics
- Grid export management
- Steam distribution

### Ethanol Division
- Fermentation tank monitoring
- Distillation column tracking
- Ethanol production metrics
- Blending operations
- Tanker dispatch system

### Animal Feed Division
- Raw material inventory
- Feed formulation recipes
- Production batch tracking
- Quality testing results
- Packaging and dispatch

## Phase 4: Financial System (Weeks 13-18)
### Division-wise Financial Management
- **Sugar Division**: Revenue from sugar sales, molasses pricing
- **Power Division**: Grid export billing, internal transfer pricing
- **Ethanol Division**: Ethanol sales, excise duty management
- **Animal Feed Division**: Feed sales, distribution costs

### Common Financial Features
- Integrated payment calculation engine
- Division-wise P&L statements
- Cost allocation between divisions
- Advance management
- Banking API integration
- Consolidated financial reporting

## Phase 5: Cloud Services (Weeks 19-24)
### Railway Deployment
- PostgreSQL setup with division-wise schemas
- Microservices architecture per division
- Cross-division data synchronization
- Integrated analytics dashboards

### Division Analytics
- **Sugar**: Yield analysis, quality trends, market pricing
- **Power**: Generation efficiency, grid stability, maintenance predictions
- **Ethanol**: Fermentation efficiency, production optimization
- **Animal Feed**: Formula optimization, inventory turnover

## Phase 6: AI Features (Weeks 25-30) ✅ STARTED
### MCP Integration
- [x] Natural language interface
- [x] Predictive maintenance alerts
- [x] Production optimization suggestions
- [x] Custom report generation
- [x] AI chat interface in frontend
- [ ] Advanced ML models
- [ ] Real-time AI recommendations

## Development Guidelines

### Code Standards
- TypeScript strict mode
- ESLint + Prettier (via Biome)
- Conventional commits
- 90%+ test coverage

### Git Workflow
- Feature branches
- Squash and merge
- Semantic versioning
- Automated releases

### Testing Strategy
- Unit tests with Vitest
- E2E tests with Playwright
- API tests with Supertest
- Load testing with k6

## Deployment

### Local (Windows)
```bash
# Build for Windows
pnpm build:windows

# Docker deployment
docker-compose -f docker/local/docker-compose.yml up
```

### Cloud (Railway)
```bash
# Deploy to Railway
railway up

# Database migrations
railway run pnpm db:migrate
```

## Common Commands
```bash
# Development
pnpm dev              # Start all services
pnpm dev:local        # Local services only
pnpm dev:cloud        # Cloud services only

# Testing
pnpm test            # Run all tests
pnpm test:unit       # Unit tests only
pnpm test:e2e        # E2E tests only

# Building
pnpm build           # Build all packages
pnpm build:docker    # Build Docker images

# Database
pnpm db:push         # Push schema changes
pnpm db:migrate      # Run migrations
pnpm db:studio       # Open Prisma Studio
```

## Deployment URLs

### Production Services (Railway) ✅ All Deployed
- **Frontend**: https://frontend-production-adfe.up.railway.app
- **Cloud API**: https://cloud-api-production-0f4d.up.railway.app
- **MCP Server**: https://mcp-server-production-ac21.up.railway.app
- **Database**: PostgreSQL on Railway (internal)
- **GitHub**: https://github.com/saifraza/ERP

### Login Credentials
- **Username**: saif
- **Password**: 1234
- **Role**: ADMIN (full access)

### Quick Test
```bash
# Test API Health
curl https://cloud-api-production-0f4d.up.railway.app/health

# Test Login
curl -X POST https://cloud-api-production-0f4d.up.railway.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "saif", "password": "1234"}'
```

### AI Features (MCP Server)
- **Natural Language Queries**: Ask questions in plain English
- **Smart Analytics**: AI-powered insights and recommendations
- **Predictive Maintenance**: Equipment failure predictions
- **Custom Reports**: Generate reports through conversation
- **Production Optimization**: Efficiency improvement suggestions

#### Try These AI Queries:
- "What's today's sugar production?"
- "Show me farmers with pending payments"
- "Any maintenance alerts this week?"
- "Generate efficiency report for ethanol division"
- "How can we optimize power generation?"

#### Gmail & Document AI Features:
- "Check for new invoices in Gmail"
- "Analyze the latest purchase order from suppliers"
- "Send production report to management"
- "Extract all attachments from today's emails"
- "Process and analyze supplier invoices"

## Environment Variables
```env
# Local Database
DATABASE_URL="sqlserver://localhost:1433;database=erp_local"

# Cloud Database (Railway)
DATABASE_URL="postgresql://postgres:qRvNDeDRjOOJQhdpNlYzGMhfJhzdAwVn@postgres.railway.internal:5432/railway"

# MCP Server (Gmail Integration)
GOOGLE_CLIENT_ID="186452386240-ljqss2cslug8q5adqlplj159ccpe1hje.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"  # Get from Google Cloud Console
GOOGLE_REFRESH_TOKEN="your-refresh-token"  # Generated after OAuth flow
RAILWAY_ENVIRONMENT="production"  # Enables internal networking
DEFAULT_COMPANY_ID="1ca3d045-b8ac-434a-bc9a-3e685bd10a94"

# Cloud API
DATABASE_URL="postgresql://postgres:xxx@postgres.railway.internal:5432/railway"
JWT_SECRET="5WnoUWSdmFHvHdNI/BHh66Erc0feyawHFi88t/qBiSk="

# Frontend
VITE_API_URL="https://cloud-api-production-0f4d.up.railway.app"

# Hardware Integration (Future)
WEIGHBRIDGE_PORT="COM3"
DCS_SERVER="192.168.1.100"
```

## Known Issues
- None yet

## Future Enhancements
- Mobile app (React Native)
- Blockchain integration for transparency
- Advanced ML models for yield prediction
- Multi-language support
- Offline-first architecture improvements

## OAuth Configuration
### Google Workspace OAuth (mspil.in)
- **Client ID**: 186452386240-ljqss2cslug8q5adqlplj159ccpe1hje.apps.googleusercontent.com
- **Project**: ERP mspil
- **Organization**: Mahakaushal Sugar and Power Industries Ltd.
- **Domain**: mspil.in
- **OAuth Type**: Internal (Google Workspace)
- **Authorized Users**: All @mspil.in email addresses
- **Setup Guide**: See `/packages/mcp-server/OAUTH_SETUP_GUIDE.md`

## Resources
- [Railway Documentation](https://docs.railway.app)
- [Vite Documentation](https://vitejs.dev)
- [Bun Documentation](https://bun.sh)
- [MCP SDK](https://github.com/anthropics/mcp)
- [Google Cloud Console](https://console.cloud.google.com)

## Contact
Solo Developer Project
Last Updated: 2025-06-23

## Recent Updates
- ✅ Consolidated APIs (removed backend-api, kept cloud-api)
- ✅ Fixed authentication to accept username "saif"
- ✅ Database migrated with seed data
- ✅ Railway internal networking optimization
- ✅ Cleaned up obsolete code and documentation
- ✅ All services deployed and operational