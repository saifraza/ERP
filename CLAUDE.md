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
- **Primary AI**: Gemini 1.5 Pro (Google AI)
- **MCP Server**: Model Context Protocol for structured AI interactions
- **OAuth Provider**: mspil.in (Mahakaushal Sugar and Power Industries Ltd.)
- **OAuth Type**: Internal (Google Workspace)
- **Gmail Features**:
  - Multi-tenant email management
  - OAuth2-based authentication
  - Email categorization and labeling
  - Attachment processing
  - Calendar integration
- **AI-Powered Features**: 
  - **Email Automation**: Automatic vendor email processing with business rules
  - **Document Intelligence**: Extract data from invoices, POs, quotations (Indian format support)
  - **Smart Classification**: AI identifies email types (invoice, PO, quotation, etc.)
  - **Auto-Actions**: Send acknowledgments, apply labels, create tasks
  - **Confidence Scoring**: Each extraction includes accuracy metrics
  - **Natural Language Chat**: Gemini-powered conversational interface
  - **Workflow Automation**: Email → Classify → Extract → Validate → Process → Respond
  - **Fallback Processing**: Regex-based extraction when AI is unavailable

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

### ✅ AI & Email Features
- [x] Gmail OAuth2 integration (Multi-tenant support)
- [x] Gemini AI integration (1.5 Pro model)
- [x] Email Automation Dashboard
- [x] Automatic vendor email processing
- [x] AI-powered document extraction (invoices, POs, quotations)
- [x] Business rules engine with auto-approval
- [x] Email template management
- [x] Smart email classification
- [x] Confidence scoring for extractions
- [x] Fallback processing without AI
- [x] Natural language chat interface
- [x] Full email content fetching
- [x] Gmail label management
- [x] Processing history with audit trail

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

## Phase 6: AI Features (Weeks 25-30) ✅ IMPLEMENTED
### Gmail Business Automation
- [x] Gemini AI integration (1.5 Pro)
- [x] Email automation dashboard
- [x] Vendor email processing pipeline
- [x] AI-powered document extraction
- [x] Business rules engine
- [x] Auto-acknowledgment system
- [x] Email template management
- [x] Processing history with audit trail

### AI Capabilities
- [x] Natural language chat interface
- [x] Smart email classification
- [x] Indian business document support (GST, PAN, HSN)
- [x] Confidence scoring for extractions
- [x] Fallback processing without AI
- [x] Multi-tenant email management
- [x] Gmail label automation
- [x] Attachment processing

### Business Automation Features
- [x] Auto-approve invoices under threshold
- [x] Vendor-specific processing rules
- [x] Task creation for manual review
- [x] Email response templates
- [x] Processing queue management
- [x] Real-time status dashboard
- [ ] Integration with ERP modules
- [ ] Advanced ML models for predictions

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

### AI Features (Gemini + Gmail Integration)
- **Email Automation**: Process vendor emails automatically
- **Document Intelligence**: Extract data from invoices, POs, quotations
- **Natural Language Interface**: Chat with Gemini AI
- **Smart Analytics**: AI-powered insights and recommendations
- **Business Process Automation**: Auto-approve, route, and respond

#### Pages to Visit:
- **Email & AI Hub**: `/mails` - Access all email features and AI chat
- **Email Automation**: `/email-automation` - Dashboard for automated processing
- **Gemini AI Tab**: In Mails page - Chat with Gemini about business

#### Try These Gemini Prompts:
- "Process unread vendor emails"
- "Extract invoice data from latest emails"
- "Show pending invoices under ₹10,000"
- "Send payment confirmations to vendors"
- "Analyze purchase orders from last week"

#### Automation Features:
- Auto-acknowledge vendor emails
- Extract and validate invoice data
- Apply business rules (auto-approval thresholds)
- Create tasks for manual review
- Send templated responses
- Full audit trail of all actions

## Environment Variables
```env
# Local Database
DATABASE_URL="sqlserver://localhost:1433;database=erp_local"

# Cloud Database (Railway)
DATABASE_URL="postgresql://postgres:qRvNDeDRjOOJQhdpNlYzGMhfJhzdAwVn@postgres.railway.internal:5432/railway"

# Gmail Integration
GOOGLE_CLIENT_ID="186452386240-ljqss2cslug8q5adqlplj159ccpe1hje.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"  # Get from Google Cloud Console
GOOGLE_REFRESH_TOKEN="your-refresh-token"  # Generated after OAuth flow

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"  # Get from https://makersuite.google.com/app/apikey

# Cloud API
DATABASE_URL="postgresql://postgres:xxx@postgres.railway.internal:5432/railway"
JWT_SECRET="5WnoUWSdmFHvHdNI/BHh66Erc0feyawHFi88t/qBiSk="
RAILWAY_ENVIRONMENT="production"  # Enables internal networking

# Frontend
VITE_API_URL="https://cloud-api-production-0f4d.up.railway.app"

# Hardware Integration (Future)
WEIGHBRIDGE_PORT="COM3"
DCS_SERVER="192.168.1.100"
```

## Known Issues
- None yet

## Key Technologies & Services

### AI & Automation
- **Gemini 1.5 Pro**: Google's advanced AI for document understanding
- **Gmail API**: Full email management with OAuth2
- **Google Calendar API**: Event management (ready for integration)
- **Model Context Protocol**: Structured AI interactions

### Email Automation Stack
- **Services**: 
  - `email-automation.ts`: Core automation engine
  - `gemini.ts`: AI service with business logic
  - `multi-tenant-gmail.ts`: Multi-company email management
- **Routes**:
  - `/api/email-automation/*`: Automation endpoints
  - `/api/gemini/*`: AI chat and analysis
  - `/api/email/*`: Email operations
- **Frontend**:
  - Email & AI Hub (`/mails`)
  - Email Automation Dashboard (`/email-automation`)
  - Gemini Chat Component

### Business Benefits
- **80% Reduction** in manual email processing
- **Automatic Data Entry** from documents to ERP
- **24/7 Processing** of vendor communications
- **Full Audit Trail** for compliance
- **Multi-tenant** support for group companies

## Future Enhancements
- WhatsApp Business API integration
- SMS notifications for critical alerts
- Voice AI for phone order processing
- Blockchain for supply chain transparency
- Advanced ML models for demand forecasting
- Multi-language support (Hindi, Regional)
- Offline-first mobile app
- IoT integration for real-time monitoring

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