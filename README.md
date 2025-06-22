# ERP System for Ethanol & Sugar Factory

A comprehensive Enterprise Resource Planning system for managing integrated operations of Sugar, Power, Ethanol, and Animal Feed divisions.

## 🏭 Business Divisions

- **Sugar Division** - Sugarcane processing, quality control, and production tracking
- **Power Division** - Bagasse-based cogeneration and grid export management  
- **Ethanol Division** - Fermentation monitoring and production optimization
- **Animal Feed Division** - Feed formulation and production management

## 🛠 Technology Stack

- **Frontend**: Vite 6.0 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Bun + Hono Framework
- **Database**: MS SQL Server (local) + PostgreSQL (cloud)
- **Cloud**: Railway deployment
- **AI Integration**: MCP Server with Claude

## 📁 Project Structure

```
ERP/
├── apps/
│   ├── local-web/      # React frontend application
│   ├── local-api/      # Bun backend API server
│   └── cloud-api/      # Railway cloud services
├── packages/
│   ├── shared/         # Shared utilities and types
│   ├── database/       # Prisma ORM and schemas
│   └── mcp-tools/      # AI integration tools
├── modules/
│   ├── common/         # Shared business logic
│   ├── sugar/          # Sugar division module
│   ├── power/          # Power division module
│   ├── ethanol/        # Ethanol division module
│   └── feed/           # Animal feed module
└── docker/             # Docker configurations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Bun runtime
- MS SQL Server
- Docker (for cross-platform deployment)

### Installation

1. Clone the repository
```bash
git clone https://github.com/saifraza/ERP.git
cd ERP
```

2. Install dependencies
```bash
npm install -g pnpm
pnpm install
```

3. Set up environment variables
```bash
cp apps/local-api/.env.example apps/local-api/.env
cp packages/database/.env.example packages/database/.env
```

4. Set up database
```bash
pnpm db:push
pnpm db:seed
```

5. Start development servers
```bash
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🔑 Features

- **Hardware Integration**: Weighbridge, DCS connectivity
- **Real-time Monitoring**: Production metrics and equipment status
- **Financial Management**: Farmer payments and division-wise accounting
- **AI-Powered Insights**: Production optimization and predictive maintenance
- **Multi-division Support**: Integrated operations with resource sharing

## 📝 Development

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint` - Run linting

## 🐳 Docker Deployment

```bash
pnpm docker:build
docker-compose up
```

## 📚 Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed project documentation and development guidelines.

## 📄 License

Private repository - All rights reserved