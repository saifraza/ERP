#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import axios from 'axios';

// Configuration
const CONFIG = {
  apiUrl: process.env.ERP_API_URL || 'https://backend-api-production-5e68.up.railway.app',
  name: 'erp-factory-mcp',
  version: '0.0.1',
};

class ERPMCPServer {
  private server: Server;
  private apiClient: any;

  constructor() {
    this.server = new Server(
      {
        name: CONFIG.name,
        version: CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.apiClient = axios.create({
      baseURL: CONFIG.apiUrl,
      timeout: 10000,
    });

    this.setupToolHandlers();
    this.setupPromptHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_production_status',
            description: 'Get current production status for all divisions (Sugar, Power, Ethanol, Feed)',
            inputSchema: {
              type: 'object',
              properties: {
                division: {
                  type: 'string',
                  enum: ['sugar', 'power', 'ethanol', 'feed', 'all'],
                  description: 'Division to query (default: all)',
                },
              },
            },
          },
          {
            name: 'get_farmer_info',
            description: 'Get farmer information and delivery history',
            inputSchema: {
              type: 'object',
              properties: {
                farmerId: {
                  type: 'string',
                  description: 'Farmer ID or name to search for',
                },
                status: {
                  type: 'string',
                  enum: ['active', 'inactive', 'pending_payment'],
                  description: 'Filter by farmer status',
                },
              },
            },
          },
          {
            name: 'analyze_efficiency',
            description: 'Analyze efficiency metrics and provide optimization suggestions',
            inputSchema: {
              type: 'object',
              properties: {
                division: {
                  type: 'string',
                  enum: ['sugar', 'power', 'ethanol', 'feed'],
                  description: 'Division to analyze',
                },
                timeRange: {
                  type: 'string',
                  enum: ['today', 'week', 'month'],
                  description: 'Time range for analysis (default: today)',
                },
              },
              required: ['division'],
            },
          },
          {
            name: 'generate_report',
            description: 'Generate custom reports with natural language description',
            inputSchema: {
              type: 'object',
              properties: {
                reportType: {
                  type: 'string',
                  enum: ['production', 'financial', 'efficiency', 'maintenance'],
                  description: 'Type of report to generate',
                },
                parameters: {
                  type: 'object',
                  description: 'Report parameters as key-value pairs',
                },
              },
              required: ['reportType'],
            },
          },
          {
            name: 'predict_maintenance',
            description: 'Predict equipment maintenance needs using AI analysis',
            inputSchema: {
              type: 'object',
              properties: {
                equipmentId: {
                  type: 'string',
                  description: 'Specific equipment ID (optional)',
                },
                division: {
                  type: 'string',
                  enum: ['sugar', 'power', 'ethanol', 'feed'],
                  description: 'Division to analyze (optional)',
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_production_status':
            return await this.getProductionStatus(args);
          case 'get_farmer_info':
            return await this.getFarmerInfo(args);
          case 'analyze_efficiency':
            return await this.analyzeEfficiency(args);
          case 'generate_report':
            return await this.generateReport(args);
          case 'predict_maintenance':
            return await this.predictMaintenance(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupPromptHandlers() {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'factory_overview',
            description: 'Get a comprehensive overview of factory operations',
          },
          {
            name: 'daily_briefing',
            description: 'Generate daily operational briefing',
          },
          {
            name: 'optimization_suggestions',
            description: 'Get AI-powered optimization suggestions',
            arguments: [
              {
                name: 'focus_area',
                description: 'Area to focus optimization on',
                required: false,
              },
            ],
          },
        ],
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'factory_overview':
          return {
            description: 'Comprehensive factory operations overview',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: 'Provide a comprehensive overview of current factory operations including production status, efficiency metrics, and any alerts or recommendations.',
                },
              },
            ],
          };

        case 'daily_briefing':
          return {
            description: 'Daily operational briefing',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: 'Generate a daily briefing covering: 1) Production targets vs actual, 2) Key performance indicators, 3) Maintenance alerts, 4) Financial highlights, 5) Action items for today.',
                },
              },
            ],
          };

        case 'optimization_suggestions':
          const focusArea = args?.focus_area || 'overall operations';
          return {
            description: 'AI-powered optimization suggestions',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Analyze current ${focusArea} and provide specific, actionable optimization suggestions to improve efficiency, reduce costs, and enhance productivity.`,
                },
              },
            ],
          };

        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  // Tool implementations
  private async getProductionStatus(args: any) {
    try {
      const response = await this.apiClient.get('/api/analytics/dashboard');
      const data = response.data;

      const division = args?.division || 'all';
      let result: any = {};

      if (division === 'all') {
        result = data.divisions;
      } else if (data.divisions[division]) {
        result[division] = data.divisions[division];
      } else {
        throw new Error(`Division '${division}' not found`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Production Status Report\\n\\n${this.formatProductionData(result)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch production status: ${error}`);
    }
  }

  private async getFarmerInfo(args: any) {
    // Mock implementation - in real system, this would query the database
    const mockFarmers = [
      {
        id: 'F001',
        name: 'Ramesh Patel',
        village: 'Madhavpur',
        landArea: 25.5,
        contractedArea: 20.0,
        status: 'active',
        pendingPayment: 0,
        lastDelivery: '2025-06-20',
      },
      {
        id: 'F002',
        name: 'Suresh Kumar',
        village: 'Taluka',
        landArea: 15.2,
        contractedArea: 15.2,
        status: 'pending_payment',
        pendingPayment: 45000,
        lastDelivery: '2025-06-19',
      },
    ];

    const { farmerId, status } = args;
    let filteredFarmers = mockFarmers;

    if (farmerId) {
      filteredFarmers = mockFarmers.filter(f => 
        f.id.toLowerCase().includes(farmerId.toLowerCase()) ||
        f.name.toLowerCase().includes(farmerId.toLowerCase())
      );
    }

    if (status) {
      filteredFarmers = filteredFarmers.filter(f => f.status === status);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Farmer Information\\n\\n${this.formatFarmerData(filteredFarmers)}`,
        },
      ],
    };
  }

  private async analyzeEfficiency(args: any) {
    const { division, timeRange = 'today' } = args;
    
    // Mock efficiency analysis
    const efficiencyData = {
      sugar: { current: 92.5, target: 95.0, trend: 'improving' },
      power: { current: 88.3, target: 90.0, trend: 'stable' },
      ethanol: { current: 94.1, target: 93.0, trend: 'excellent' },
      feed: { current: 87.2, target: 89.0, trend: 'declining' },
    };

    const data = efficiencyData[division as keyof typeof efficiencyData];
    
    const analysis = this.generateEfficiencyAnalysis(division, data, timeRange);

    return {
      content: [
        {
          type: 'text',
          text: analysis,
        },
      ],
    };
  }

  private async generateReport(args: any) {
    const { reportType, parameters = {} } = args;
    
    const reportContent = this.createReport(reportType, parameters);

    return {
      content: [
        {
          type: 'text',
          text: reportContent,
        },
      ],
    };
  }

  private async predictMaintenance(args: any) {
    const { equipmentId, division } = args;
    
    // Mock predictive maintenance analysis
    const predictions = this.generateMaintenancePredictions(equipmentId, division);

    return {
      content: [
        {
          type: 'text',
          text: predictions,
        },
      ],
    };
  }

  // Helper methods
  private formatProductionData(data: any): string {
    let output = '';
    for (const [division, metrics] of Object.entries(data)) {
      output += `${division.toUpperCase()} Division:\\n`;
      if (typeof metrics === 'object' && metrics !== null) {
        for (const [key, value] of Object.entries(metrics)) {
          output += `  ${key}: ${value}\\n`;
        }
      }
      output += '\\n';
    }
    return output;
  }

  private formatFarmerData(farmers: any[]): string {
    if (farmers.length === 0) {
      return 'No farmers found matching the criteria.';
    }

    let output = '';
    farmers.forEach(farmer => {
      output += `Farmer: ${farmer.name} (${farmer.id})\\n`;
      output += `  Village: ${farmer.village}\\n`;
      output += `  Land Area: ${farmer.landArea} hectares\\n`;
      output += `  Status: ${farmer.status}\\n`;
      if (farmer.pendingPayment > 0) {
        output += `  Pending Payment: ₹${farmer.pendingPayment.toLocaleString()}\\n`;
      }
      output += `  Last Delivery: ${farmer.lastDelivery}\\n\\n`;
    });

    return output;
  }

  private generateEfficiencyAnalysis(division: string, data: any, timeRange: string): string {
    const performance = data.current >= data.target ? 'ABOVE TARGET' : 'BELOW TARGET';
    const gap = Math.abs(data.current - data.target);
    
    return `EFFICIENCY ANALYSIS - ${division.toUpperCase()} DIVISION (${timeRange})

Current Efficiency: ${data.current}%
Target Efficiency: ${data.target}%
Performance: ${performance}
Gap: ${gap.toFixed(1)}%
Trend: ${data.trend}

RECOMMENDATIONS:
${this.getEfficiencyRecommendations(division, data)}`;
  }

  private getEfficiencyRecommendations(division: string, data: any): string {
    if (data.current >= data.target) {
      return `✅ Excellent performance! Continue current practices and consider:
- Sharing best practices with other divisions
- Fine-tuning processes for even better results
- Training operators to maintain this level`;
    } else {
      const recommendations = {
        sugar: '- Optimize crushing mill settings\n- Check juice extraction efficiency\n- Review crystallization process parameters',
        power: '- Inspect boiler efficiency\n- Check steam pressure optimization\n- Review bagasse moisture content',
        ethanol: '- Monitor fermentation temperature\n- Check distillation column efficiency\n- Optimize yeast culture management',
        feed: '- Review pelletizing process\n- Check moisture control systems\n- Optimize ingredient mixing ratios',
      };
      
      return recommendations[division as keyof typeof recommendations] || '- Review operational parameters\n- Conduct equipment inspection\n- Analyze process bottlenecks';
    }
  }

  private createReport(reportType: string, parameters: any): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (reportType) {
      case 'production':
        return `PRODUCTION REPORT - ${timestamp}

DAILY PRODUCTION SUMMARY:
- Sugar: 2,450 MT (Target: 2,500 MT) - 98% achievement
- Power: 12.5 MW generated, 8.5 MW exported
- Ethanol: 45,000 L (Target: 44,000 L) - 102% achievement  
- Animal Feed: 890 MT (Target: 900 MT) - 99% achievement

KEY HIGHLIGHTS:
✅ Ethanol production exceeded target
⚠️ Sugar production slightly below target
📈 Overall efficiency at 92.5%`;

      case 'financial':
        return `FINANCIAL REPORT - ${timestamp}

REVENUE SUMMARY:
- Sugar Sales: ₹1,47,00,000
- Power Export: ₹68,00,000
- Ethanol Sales: ₹2,25,00,000
- Feed Sales: ₹44,50,000
Total Revenue: ₹4,84,50,000

PENDING PAYMENTS:
- Farmer Payments: ₹12,50,000
- Supplier Dues: ₹8,75,000`;

      case 'efficiency':
        return `EFFICIENCY REPORT - ${timestamp}

DIVISION EFFICIENCY:
- Sugar: 92.5% (Target: 95%)
- Power: 88.3% (Target: 90%)
- Ethanol: 94.1% (Target: 93%)
- Feed: 87.2% (Target: 89%)

OVERALL PERFORMANCE: 90.5%`;

      case 'maintenance':
        return `MAINTENANCE REPORT - ${timestamp}

SCHEDULED MAINTENANCE:
- Crushing Mill #2: Due in 3 days
- Boiler #1: Overdue by 2 days ⚠️
- Distillation Column: Due next week

BREAKDOWN ALERTS:
- Feed Pelletizer: Minor repair needed
- Conveyor Belt #3: Replace bearings`;

      default:
        return `Custom report generated for ${reportType} on ${timestamp}`;
    }
  }

  private generateMaintenancePredictions(equipmentId?: string, division?: string): string {
    return `PREDICTIVE MAINTENANCE ANALYSIS

🔍 AI ANALYSIS RESULTS:

HIGH PRIORITY (Next 7 days):
⚠️ Boiler #1 (Power Division)
   - Predicted failure probability: 75%
   - Recommended action: Immediate inspection
   - Estimated downtime if failed: 8-12 hours

MEDIUM PRIORITY (Next 30 days):
🔧 Crushing Mill #2 (Sugar Division)
   - Predicted maintenance need: 45%
   - Component: Bearing replacement
   - Optimal maintenance window: Weekend shutdown

📊 COST OPTIMIZATION:
- Preventive maintenance cost: ₹50,000
- Breakdown repair cost: ₹2,50,000
- Recommended: Schedule preventive maintenance

AI CONFIDENCE: 87% based on historical data and sensor readings`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ERP Factory MCP Server running on stdio');
  }
}

// Start the server
const server = new ERPMCPServer();
server.run().catch(console.error);