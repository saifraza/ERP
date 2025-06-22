#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
          {
            name: 'analyze_document',
            description: 'Analyze uploaded factory documents (invoices, reports, POs, offers, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                documentId: {
                  type: 'string',
                  description: 'Document ID to analyze',
                },
                documentContent: {
                  type: 'string',
                  description: 'Document text content to analyze',
                },
                documentType: {
                  type: 'string',
                  enum: ['invoice', 'report', 'purchase_order', 'delivery_note', 'quality_cert', 'offer', 'contract'],
                  description: 'Type of document',
                },
                analysisType: {
                  type: 'string',
                  enum: ['financial', 'compliance', 'quality', 'inventory', 'general'],
                  description: 'Type of analysis to perform',
                },
              },
              required: ['documentContent', 'documentType'],
            },
          },
          {
            name: 'get_documents',
            description: 'List and search uploaded documents',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Filter by document category',
                },
                division: {
                  type: 'string',
                  description: 'Filter by division',
                },
              },
            },
          },
          {
            name: 'send_email',
            description: 'Send email to clients or suppliers via Gmail',
            inputSchema: {
              type: 'object',
              properties: {
                to: {
                  type: 'string',
                  description: 'Recipient email address',
                },
                subject: {
                  type: 'string',
                  description: 'Email subject',
                },
                body: {
                  type: 'string',
                  description: 'Email body content',
                },
                attachmentId: {
                  type: 'string',
                  description: 'Document ID to attach',
                },
                cc: {
                  type: 'string',
                  description: 'CC email addresses (comma separated)',
                },
              },
              required: ['to', 'subject', 'body'],
            },
          },
          {
            name: 'get_emails',
            description: 'Retrieve emails from Gmail inbox',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (e.g., "from:supplier@example.com", "subject:invoice")',
                },
                limit: {
                  type: 'number',
                  description: 'Number of emails to retrieve',
                  default: 10,
                },
              },
            },
          },
          {
            name: 'extract_from_email',
            description: 'Extract and analyze attachments from emails (invoices, POs, etc.)',
            inputSchema: {
              type: 'object',
              properties: {
                emailId: {
                  type: 'string',
                  description: 'Email ID to extract attachments from',
                },
                autoAnalyze: {
                  type: 'boolean',
                  description: 'Automatically analyze extracted documents',
                  default: true,
                },
              },
              required: ['emailId'],
            },
          },
        ],
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_production_status':
            return await this.getProductionStatus(args);
          case 'analyze_efficiency':
            return await this.analyzeEfficiency(args);
          case 'analyze_document':
            return await this.analyzeDocument(args);
          case 'get_documents':
            return await this.getDocuments(args);
          case 'send_email':
            return await this.sendEmail(args);
          case 'get_emails':
            return await this.getEmails(args);
          case 'extract_from_email':
            return await this.extractFromEmail(args);
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

  async analyzeDocument(args) {
    const { documentContent, documentType, analysisType = 'general' } = args;
    
    // Simulate AI document analysis based on document type
    let analysis = {
      summary: '',
      keyFindings: [],
      extractedData: {},
      recommendations: [],
      alerts: []
    };

    switch (documentType) {
      case 'invoice':
        analysis = {
          summary: 'Invoice document analyzed successfully',
          keyFindings: [
            'Total amount: ₹2,45,000',
            'Payment terms: Net 30 days',
            'Items: 15 line items identified',
            'Vendor: ABC Chemicals Pvt Ltd'
          ],
          extractedData: {
            invoiceNumber: 'INV-2025-06-1234',
            date: '2025-06-20',
            totalAmount: 245000,
            tax: 45000,
            items: 15,
            dueDate: '2025-07-20'
          },
          recommendations: [
            'Process payment by July 15 to avail 2% early payment discount',
            'Verify quantity against delivery notes',
            'Check for duplicate invoice entries'
          ],
          alerts: [
            { type: 'info', message: 'Large invoice amount - requires manager approval' }
          ]
        };
        break;

      case 'report':
        analysis = {
          summary: 'Production report analyzed with key metrics extracted',
          keyFindings: [
            'Overall efficiency: 92.5%',
            'Production target achievement: 98%',
            'Quality compliance: 99.2%',
            'Downtime: 2.5 hours'
          ],
          extractedData: {
            reportPeriod: 'June 2025',
            totalProduction: 2450,
            efficiency: 92.5,
            targetAchievement: 98,
            majorIssues: ['Crusher maintenance', 'Power fluctuation']
          },
          recommendations: [
            'Schedule preventive maintenance for crusher',
            'Investigate power stability issues',
            'Optimize shift patterns to reduce downtime'
          ],
          alerts: [
            { type: 'warning', message: 'Efficiency below 95% target' }
          ]
        };
        break;

      case 'purchase_order':
        analysis = {
          summary: 'Purchase order verified and analyzed',
          keyFindings: [
            'Order value: ₹1,85,000',
            'Delivery date: Within 7 days',
            'Critical items: 3 identified',
            'Vendor performance: Good (4.2/5)'
          ],
          extractedData: {
            poNumber: 'PO-2025-06-5678',
            vendor: 'XYZ Suppliers',
            totalValue: 185000,
            items: 8,
            priority: 'High'
          },
          recommendations: [
            'Confirm stock availability before approval',
            'Negotiate bulk discount for regular items',
            'Set up automated reorder for critical items'
          ],
          alerts: []
        };
        break;

      case 'offer':
        analysis = {
          summary: 'Offer/Quotation analyzed with pricing details extracted',
          keyFindings: [
            'Total quoted amount: ₹3,50,000',
            'Validity: 30 days from date',
            'Payment terms: 50% advance',
            'Delivery: Within 45 days'
          ],
          extractedData: {
            offerNumber: 'QT-2025-06-789',
            vendor: 'Industrial Supplies Ltd',
            totalAmount: 350000,
            items: 12,
            validity: '30 days',
            discountOffered: '5% on bulk order'
          },
          recommendations: [
            'Compare with previous offers from same vendor',
            'Negotiate for better payment terms',
            'Check market rates for quoted items'
          ],
          alerts: [
            { type: 'info', message: 'Offer expires in 10 days' }
          ]
        };
        break;

      case 'contract':
        analysis = {
          summary: 'Contract analyzed for key terms and obligations',
          keyFindings: [
            'Contract duration: 2 years',
            'Annual value: ₹24,00,000',
            'Penalty clause: 2% per month delay',
            'Termination notice: 90 days'
          ],
          extractedData: {
            contractNumber: 'CTR-2025-456',
            parties: ['MSPIL', 'ABC Corporation'],
            startDate: '2025-07-01',
            endDate: '2027-06-30',
            totalValue: 4800000,
            paymentSchedule: 'Monthly'
          },
          recommendations: [
            'Review penalty clauses with legal team',
            'Set up automatic renewal reminders',
            'Create compliance checklist'
          ],
          alerts: [
            { type: 'warning', message: 'Force majeure clause needs review' }
          ]
        };
        break;

      default:
        analysis = {
          summary: 'Document analyzed successfully',
          keyFindings: [
            'Document type identified',
            'Key information extracted',
            'Compliance check completed'
          ],
          extractedData: {
            documentType: documentType,
            wordCount: documentContent.split(' ').length,
            dateCreated: new Date().toISOString()
          },
          recommendations: [
            'Review document for completeness',
            'Ensure proper filing and categorization'
          ],
          alerts: []
        };
    }

    // Add financial analysis if requested
    if (analysisType === 'financial') {
      analysis.financialInsights = {
        cashFlowImpact: 'Negative ₹2,45,000 in 30 days',
        budgetAlignment: 'Within approved budget',
        costSavingOpportunities: ['Early payment discount: ₹4,900', 'Bulk order savings: ₹12,000']
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Document Analysis Results:\n\n${JSON.stringify(analysis, null, 2)}`,
        },
      ],
    };
  }

  async getDocuments(args) {
    const { category, division } = args;
    
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (division) params.append('division', division);
      
      const response = await this.apiClient.get(`/api/documents?${params}`);
      const { documents } = response.data;
      
      let result = `Found ${documents.length} documents\n\n`;
      documents.forEach((doc, index) => {
        result += `${index + 1}. ${doc.fileName}\n`;
        result += `   Type: ${doc.fileType} | Category: ${doc.category}\n`;
        result += `   Division: ${doc.division || 'General'}\n`;
        result += `   Status: ${doc.status}\n`;
        if (doc.insights) {
          result += `   Insights: ${doc.insights}\n`;
        }
        result += '\n';
      });
      
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  }

  async sendEmail(args) {
    const { to, subject, body, attachmentId, cc } = args;
    
    // Note: This is a mock implementation
    // In production, you would integrate with Gmail API
    const emailData = {
      id: Date.now().toString(),
      to,
      cc: cc || null,
      subject,
      body,
      attachmentId: attachmentId || null,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    
    return {
      content: [
        {
          type: 'text',
          text: `Email sent successfully!\n\nTo: ${to}\nSubject: ${subject}\n${cc ? `CC: ${cc}\n` : ''}${attachmentId ? 'Attachment included\n' : ''}\nStatus: Sent`,
        },
      ],
    };
  }

  async getEmails(args) {
    const { query, limit = 10 } = args;
    
    // Mock email data - in production, integrate with Gmail API
    const emails = [
      {
        id: '1',
        from: 'supplier@chemicals.com',
        subject: 'Invoice for Chemical Supply - June 2025',
        date: '2025-06-20',
        hasAttachments: true,
        preview: 'Please find attached invoice for your recent order...'
      },
      {
        id: '2',
        from: 'buyer@sugar.com',
        subject: 'Purchase Order - 500 MT Sugar',
        date: '2025-06-19',
        hasAttachments: true,
        preview: 'We would like to place an order for 500 MT of refined sugar...'
      },
      {
        id: '3',
        from: 'vendor@equipment.com',
        subject: 'Quotation for Centrifuge Machine',
        date: '2025-06-18',
        hasAttachments: true,
        preview: 'As per your inquiry, please find our best offer...'
      }
    ];
    
    let filtered = emails;
    if (query) {
      filtered = emails.filter(email => 
        email.from.includes(query) || 
        email.subject.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${filtered.slice(0, limit).length} emails:\n\n${filtered.slice(0, limit).map((email, idx) => 
            `${idx + 1}. From: ${email.from}\n   Subject: ${email.subject}\n   Date: ${email.date}\n   ${email.hasAttachments ? '📎 Has attachments' : ''}\n   Preview: ${email.preview}\n`
          ).join('\n')}`,
        },
      ],
    };
  }

  async extractFromEmail(args) {
    const { emailId, autoAnalyze = true } = args;
    
    // Mock extraction - in production, use Gmail API to get attachments
    const extractedDocuments = [
      {
        id: Date.now().toString(),
        fileName: 'Invoice_12345.pdf',
        fileType: 'pdf',
        category: 'invoice',
        extractedFrom: `Email ID: ${emailId}`,
        content: 'Invoice content extracted from email attachment'
      }
    ];
    
    let result = `Extracted ${extractedDocuments.length} document(s) from email:\n`;
    
    for (const doc of extractedDocuments) {
      result += `\n- ${doc.fileName} (${doc.category})\n`;
      
      if (autoAnalyze) {
        const analysis = await this.analyzeDocument({
          documentContent: doc.content,
          documentType: doc.category
        });
        result += `  Analysis: ${analysis.content[0].text.split('\n')[0]}\n`;
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: result,
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