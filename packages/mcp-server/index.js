#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';

// Configuration
const CONFIG = {
  apiUrl: process.env.ERP_API_URL || 'https://backend-api-production-5e68.up.railway.app',
  name: 'erp-factory-mcp',
  version: '0.0.1',
};

class ERPMCPServer {
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

    this.setupHandlers();
  }

  setupHandlers() {
    // List tools handler
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'get_production_status',
            description: 'Get current production status for all divisions',
            inputSchema: {
              type: 'object',
              properties: {
                division: {
                  type: 'string',
                  enum: ['sugar', 'power', 'ethanol', 'feed', 'all'],
                  description: 'Division to query',
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
              },
              required: ['division'],
            },
          },
        ],
      };
    });

    // Call tool handler
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_production_status':
            return await this.getProductionStatus(args);
          case 'analyze_efficiency':
            return await this.analyzeEfficiency(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getProductionStatus(args) {
    try {
      const response = await this.apiClient.get('/api/analytics/dashboard');
      const data = response.data;

      return {
        content: [
          {
            type: 'text',
            text: `Production Status:\n${JSON.stringify(data.divisions, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch production status: ${error.message}`);
    }
  }

  async analyzeEfficiency(args) {
    const { division } = args;
    
    // Mock efficiency analysis
    const analysis = `
Efficiency Analysis for ${division.toUpperCase()} Division:
- Current efficiency: 92.5%
- Target efficiency: 95%
- Gap: 2.5%

Recommendations:
- Optimize process parameters
- Schedule preventive maintenance
- Review operator training needs
`;

    return {
      content: [
        {
          type: 'text',
          text: analysis,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ERP Factory MCP Server running');
  }
}

// Start the server
const server = new ERPMCPServer();
server.run().catch(console.error);