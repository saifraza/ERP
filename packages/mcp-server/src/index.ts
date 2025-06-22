#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { DocumentAnalyzer } from './document-tools.js';

// Environment variables required for OAuth
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  throw new Error('Required Google OAuth credentials not found in environment variables');
}

class GoogleWorkspaceServer {
  private server: Server;
  private auth;
  private gmail;
  private calendar;
  private documentAnalyzer: DocumentAnalyzer;

  constructor() {
    this.server = new Server(
      {
        name: 'google-workspace-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up OAuth2 client
    this.auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    this.auth.setCredentials({ refresh_token: REFRESH_TOKEN });

    // Initialize API clients
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    
    // Initialize document analyzer
    const apiUrl = process.env.ERP_API_URL || 'https://backend-api-production-5e68.up.railway.app';
    this.documentAnalyzer = new DocumentAnalyzer(apiUrl);

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_emails',
          description: 'List recent emails from Gmail inbox',
          inputSchema: {
            type: 'object',
            properties: {
              maxResults: {
                type: 'number',
                description: 'Maximum number of emails to return (default: 10)',
              },
              query: {
                type: 'string',
                description: 'Search query to filter emails',
              },
            },
          },
        },
        {
          name: 'search_emails',
          description: 'Search emails with advanced query',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Gmail search query (e.g., "from:example@gmail.com has:attachment")',
                required: true
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of emails to return (default: 10)',
              },
            },
            required: ['query']
          },
        },
        {
          name: 'send_email',
          description: 'Send a new email',
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
                description: 'Email body (can include HTML)',
              },
              cc: {
                type: 'string',
                description: 'CC recipients (comma-separated)',
              },
              bcc: {
                type: 'string',
                description: 'BCC recipients (comma-separated)',
              },
            },
            required: ['to', 'subject', 'body']
          },
        },
        {
          name: 'modify_email',
          description: 'Modify email labels (archive, trash, mark read/unread)',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Email ID',
              },
              addLabels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Labels to add',
              },
              removeLabels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Labels to remove',
              },
            },
            required: ['id']
          },
        },
        {
          name: 'list_events',
          description: 'List upcoming calendar events',
          inputSchema: {
            type: 'object',
            properties: {
              maxResults: {
                type: 'number',
                description: 'Maximum number of events to return (default: 10)',
              },
              timeMin: {
                type: 'string',
                description: 'Start time in ISO format (default: now)',
              },
              timeMax: {
                type: 'string',
                description: 'End time in ISO format',
              },
            },
          },
        },
        {
          name: 'create_event',
          description: 'Create a new calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'Event title',
              },
              location: {
                type: 'string',
                description: 'Event location',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              start: {
                type: 'string',
                description: 'Start time in ISO format',
              },
              end: {
                type: 'string',
                description: 'End time in ISO format',
              },
              attendees: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of attendee email addresses',
              },
            },
            required: ['summary', 'start', 'end']
          },
        },
        {
          name: 'update_event',
          description: 'Update an existing calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'Event ID to update',
              },
              summary: {
                type: 'string',
                description: 'New event title',
              },
              location: {
                type: 'string',
                description: 'New event location',
              },
              description: {
                type: 'string',
                description: 'New event description',
              },
              start: {
                type: 'string',
                description: 'New start time in ISO format',
              },
              end: {
                type: 'string',
                description: 'New end time in ISO format',
              },
              attendees: {
                type: 'array',
                items: { type: 'string' },
                description: 'New list of attendee email addresses',
              },
            },
            required: ['eventId']
          },
        },
        {
          name: 'delete_event',
          description: 'Delete a calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'Event ID to delete',
              },
            },
            required: ['eventId']
          },
        },
        {
          name: 'extract_attachments',
          description: 'Extract attachments from an email',
          inputSchema: {
            type: 'object',
            properties: {
              emailId: {
                type: 'string',
                description: 'Email ID to extract attachments from',
              },
              analyzeDocuments: {
                type: 'boolean',
                description: 'Automatically analyze extracted documents',
                default: true,
              },
            },
            required: ['emailId']
          },
        },
        {
          name: 'analyze_document',
          description: 'Analyze factory documents (invoices, POs, offers, contracts)',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Document text content to analyze',
              },
              documentType: {
                type: 'string',
                enum: ['invoice', 'purchase_order', 'offer', 'quotation', 'contract', 'delivery_note', 'quality_cert'],
                description: 'Type of document',
              },
              analysisType: {
                type: 'string',
                enum: ['general', 'financial', 'compliance', 'quality'],
                description: 'Type of analysis to perform',
                default: 'general',
              },
            },
            required: ['content', 'documentType']
          },
        },
        {
          name: 'process_email_documents',
          description: 'Process all documents from emails matching a query',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Gmail search query (e.g., "has:attachment from:supplier@example.com")',
              },
              maxEmails: {
                type: 'number',
                description: 'Maximum number of emails to process',
                default: 5,
              },
              autoStore: {
                type: 'boolean',
                description: 'Automatically store analyzed documents',
                default: true,
              },
            },
            required: ['query']
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_emails':
          return await this.handleListEmails(request.params.arguments);
        case 'search_emails':
          return await this.handleSearchEmails(request.params.arguments);
        case 'send_email':
          return await this.handleSendEmail(request.params.arguments);
        case 'modify_email':
          return await this.handleModifyEmail(request.params.arguments);
        case 'list_events':
          return await this.handleListEvents(request.params.arguments);
        case 'create_event':
          return await this.handleCreateEvent(request.params.arguments);
        case 'update_event':
          return await this.handleUpdateEvent(request.params.arguments);
        case 'delete_event':
          return await this.handleDeleteEvent(request.params.arguments);
        case 'extract_attachments':
          return await this.handleExtractAttachments(request.params.arguments);
        case 'analyze_document':
          return await this.handleAnalyzeDocument(request.params.arguments);
        case 'process_email_documents':
          return await this.handleProcessEmailDocuments(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async handleListEmails(args: any) {
    try {
      const maxResults = args?.maxResults || 10;
      const query = args?.query || '';

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });

      const messages = response.data.messages || [];
      const emailDetails = await Promise.all(
        messages.map(async (msg) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
          });
          
          const headers = detail.data.payload?.headers;
          const subject = headers?.find((h) => h.name === 'Subject')?.value || '';
          const from = headers?.find((h) => h.name === 'From')?.value || '';
          const date = headers?.find((h) => h.name === 'Date')?.value || '';

          return {
            id: msg.id,
            subject,
            from,
            date,
          };
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(emailDetails, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching emails: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleSearchEmails(args: any) {
    try {
      const maxResults = args?.maxResults || 10;
      const query = args?.query || '';

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });

      const messages = response.data.messages || [];
      const emailDetails = await Promise.all(
        messages.map(async (msg) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
          });
          
          const headers = detail.data.payload?.headers;
          const subject = headers?.find((h) => h.name === 'Subject')?.value || '';
          const from = headers?.find((h) => h.name === 'From')?.value || '';
          const date = headers?.find((h) => h.name === 'Date')?.value || '';

          return {
            id: msg.id,
            subject,
            from,
            date,
          };
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(emailDetails, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching emails: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleSendEmail(args: any) {
    try {
      const { to, subject, body, cc, bcc } = args;

      // Create email content
      const message = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        bcc ? `Bcc: ${bcc}` : '',
        `Subject: ${subject}`,
        '',
        body,
      ].filter(Boolean).join('\r\n');

      // Encode the email
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the email
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: `Email sent successfully. Message ID: ${response.data.id}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error sending email: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleModifyEmail(args: any) {
    try {
      const { id, addLabels = [], removeLabels = [] } = args;

      const response = await this.gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          addLabelIds: addLabels,
          removeLabelIds: removeLabels,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: `Email modified successfully. Updated labels for message ID: ${response.data.id}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error modifying email: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleCreateEvent(args: any) {
    try {
      const { summary, location, description, start, end, attendees = [] } = args;

      const event = {
        summary,
        location,
        description,
        start: {
          dateTime: start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: attendees.map((email: string) => ({ email })),
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Event created successfully. Event ID: ${response.data.id}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating event: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleUpdateEvent(args: any) {
    try {
      const { eventId, summary, location, description, start, end, attendees } = args;

      const event: any = {};
      if (summary) event.summary = summary;
      if (location) event.location = location;
      if (description) event.description = description;
      if (start) {
        event.start = {
          dateTime: start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
      if (end) {
        event.end = {
          dateTime: end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
      if (attendees) {
        event.attendees = attendees.map((email: string) => ({ email }));
      }

      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Event updated successfully. Event ID: ${response.data.id}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating event: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleDeleteEvent(args: any) {
    try {
      const { eventId } = args;

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Event deleted successfully. Event ID: ${eventId}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error deleting event: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleListEvents(args: any) {
    try {
      const maxResults = args?.maxResults || 10;
      const timeMin = args?.timeMin || new Date().toISOString();
      const timeMax = args?.timeMax;

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items?.map((event) => ({
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        location: event.location,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(events, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching calendar events: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleExtractAttachments(args: any) {
    try {
      const { emailId, analyzeDocuments = true } = args;
      
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: emailId,
      });

      const attachments = [];
      const parts = message.data.payload?.parts || [];
      
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          const attachment = await this.gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: emailId,
            id: part.body.attachmentId,
          });
          
          const data = attachment.data.data;
          const buffer = Buffer.from(data!, 'base64');
          
          const attachmentInfo: any = {
            filename: part.filename,
            mimeType: part.mimeType,
            size: attachment.data.size,
            content: buffer.toString('utf-8'),
          };
          
          if (analyzeDocuments) {
            const documentType = this.detectDocumentType(part.filename);
            const analysis = await this.documentAnalyzer.analyzeDocument(
              attachmentInfo.content,
              documentType
            );
            attachmentInfo.analysis = analysis;
          }
          
          attachments.push(attachmentInfo);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              emailId,
              attachmentCount: attachments.length,
              attachments: attachments.map(a => ({
                filename: a.filename,
                mimeType: a.mimeType,
                size: a.size,
                analysis: a.analysis
              }))
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error extracting attachments: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleAnalyzeDocument(args: any) {
    try {
      const { content, documentType, analysisType = 'general' } = args;
      
      const analysis = await this.documentAnalyzer.analyzeDocument(
        content,
        documentType,
        analysisType
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing document: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleProcessEmailDocuments(args: any) {
    try {
      const { query, maxEmails = 5, autoStore = true } = args;
      
      // Search for emails
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxEmails,
        q: query,
      });

      const messages = response.data.messages || [];
      const processedDocuments = [];

      for (const message of messages) {
        const detail = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });
        
        const headers = detail.data.payload?.headers;
        const subject = headers?.find((h) => h.name === 'Subject')?.value || '';
        const from = headers?.find((h) => h.name === 'From')?.value || '';
        
        // Extract attachments
        const parts = detail.data.payload?.parts || [];
        
        for (const part of parts) {
          if (part.filename && part.body?.attachmentId) {
            const attachment = await this.gmail.users.messages.attachments.get({
              userId: 'me',
              messageId: message.id!,
              id: part.body.attachmentId,
            });
            
            const data = attachment.data.data;
            const buffer = Buffer.from(data!, 'base64');
            const content = buffer.toString('utf-8');
            
            const documentType = this.detectDocumentType(part.filename);
            const analysis = await this.documentAnalyzer.analyzeDocument(
              content,
              documentType,
              'financial'
            );
            
            const documentInfo = {
              emailId: message.id,
              subject,
              from,
              filename: part.filename,
              documentType,
              analysis,
            };
            
            if (autoStore) {
              await this.documentAnalyzer.storeDocument({
                fileName: part.filename,
                fileType: documentType,
                category: documentType,
                content: content,
                aiAnalysis: JSON.stringify(analysis),
                emailSource: from,
              });
            }
            
            processedDocuments.push(documentInfo);
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              emailsProcessed: messages.length,
              documentsFound: processedDocuments.length,
              documents: processedDocuments,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error processing email documents: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private detectDocumentType(filename: string): string {
    const name = filename.toLowerCase();
    if (name.includes('invoice') || name.includes('inv')) return 'invoice';
    if (name.includes('po') || name.includes('purchase')) return 'purchase_order';
    if (name.includes('offer') || name.includes('quote') || name.includes('quotation')) return 'offer';
    if (name.includes('contract') || name.includes('agreement')) return 'contract';
    if (name.includes('delivery') || name.includes('dn')) return 'delivery_note';
    if (name.includes('quality') || name.includes('cert')) return 'quality_cert';
    return 'invoice'; // default
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Workspace MCP server running on stdio');
  }
}

const server = new GoogleWorkspaceServer();
server.run().catch(console.error);
