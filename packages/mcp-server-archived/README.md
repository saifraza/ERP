# ERP Factory MCP Server

A Model Context Protocol (MCP) server that provides AI-powered tools for factory operations, enabling natural language queries and intelligent automation for the ERP system.

## Features

### 🤖 AI Tools Available

1. **get_production_status** - Get real-time production metrics for all divisions
2. **get_farmer_info** - Query farmer information and payment status
3. **analyze_efficiency** - AI-powered efficiency analysis with recommendations
4. **generate_report** - Create custom reports (production, financial, efficiency, maintenance)
5. **predict_maintenance** - Predictive maintenance alerts using AI

### 💬 Natural Language Queries

- "What's today's sugar production?"
- "Show me farmers with pending payments"
- "Which equipment needs maintenance?"
- "Generate efficiency report for ethanol division"
- "Any maintenance alerts this week?"

### 📊 Smart Analytics

- Production optimization suggestions
- Quality trend analysis
- Resource allocation recommendations
- Predictive maintenance alerts
- Cost optimization insights

## Installation

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "erp-factory": {
      "command": "node",
      "args": ["/path/to/erp/packages/mcp-server/dist/index.js"]
    }
  }
}
```

## API Integration

The MCP server connects to your ERP backend API at:
- **Default**: `https://backend-api-production-5e68.up.railway.app`
- **Override**: Set `ERP_API_URL` environment variable

## Example Interactions

### Production Status Query
```
User: "How is production doing today?"
AI: "📊 Current Production Status
Sugar Division: 2,450 MT (98% of target)
Power Division: 12.5 MW generated, 8.5 MW exported
Ethanol Division: 45,000 L (102% of target) ✅
..."
```

### Efficiency Analysis
```
User: "Analyze sugar division efficiency"
AI: "⚡ Sugar division is at 92.5% efficiency (target: 95%)
Recommendations:
- Optimize crushing mill settings (+1.5% potential)
- Check juice extraction efficiency
- Review crystallization parameters"
```

### Maintenance Predictions
```
User: "Any equipment maintenance needed?"
AI: "🔧 URGENT: Boiler #1 has 75% failure probability
Recommended: Immediate inspection
Cost to fix now: ₹50,000 vs ₹2,50,000 if it breaks"
```

## Architecture

```
Claude Desktop ↔ MCP Server ↔ ERP Backend API ↔ Database
```

- **MCP Server**: Translates natural language to API calls
- **ERP Backend**: Provides data and business logic
- **Database**: PostgreSQL with all factory data

## Development

The server is built with:
- **TypeScript** for type safety
- **@modelcontextprotocol/sdk** for MCP implementation
- **Zod** for data validation
- **Axios** for API communication

## Deployment

Deploy to Railway or any Node.js hosting platform:

```bash
# Deploy to Railway
pnpm deploy
```

## License

Part of the ERP Factory system.