import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    this.genAI = new GoogleGenerativeAI(apiKey)
    // Use Gemini 1.5 Pro for best performance
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      }
    })
  }

  /**
   * Generate a response using Gemini
   */
  async generateResponse(prompt: string, context?: any): Promise<string> {
    try {
      const contextString = context ? `\nContext: ${JSON.stringify(context)}` : ''
      const fullPrompt = `${prompt}${contextString}`
      
      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini generation error:', error)
      throw new Error('Failed to generate response')
    }
  }

  /**
   * Analyze email content and suggest actions
   */
  async analyzeEmail(emailContent: any) {
    const prompt = `Analyze this email and provide:
    1. A brief summary
    2. Key action items
    3. Suggested response (if needed)
    4. Priority level (high/medium/low)
    
    Email Details:
    From: ${emailContent.from}
    Subject: ${emailContent.subject}
    Content: ${emailContent.body || emailContent.snippet}
    
    Provide response in JSON format.`

    const response = await this.generateResponse(prompt)
    try {
      // Try to parse as JSON, fallback to text if failed
      return JSON.parse(response)
    } catch {
      return { analysis: response }
    }
  }

  /**
   * Extract data from documents (invoices, POs, etc)
   */
  async extractDocumentData(documentText: string, documentType: string = 'invoice') {
    const prompt = `Extract structured data from this ${documentType}:
    
    ${documentText}
    
    Extract the following information (if available):
    - Document number
    - Date
    - Vendor/Customer name
    - Items/Services with quantities and prices
    - Total amount
    - Payment terms
    - Any other relevant details
    
    Provide response in JSON format.`

    const response = await this.generateResponse(prompt)
    try {
      return JSON.parse(response)
    } catch {
      return { extractedData: response }
    }
  }

  /**
   * Generate contextual email response
   */
  async generateEmailResponse(originalEmail: any, instructions: string) {
    const prompt = `Generate a professional email response based on:
    
    Original Email:
    From: ${originalEmail.from}
    Subject: ${originalEmail.subject}
    Content: ${originalEmail.body || originalEmail.snippet}
    
    Instructions: ${instructions}
    
    Generate a complete email response including subject line and body.`

    return await this.generateResponse(prompt)
  }

  /**
   * Analyze factory data and provide insights
   */
  async analyzeFactoryData(data: any, queryType: string) {
    const prompt = `Analyze this factory data and provide insights:
    
    Query Type: ${queryType}
    Data: ${JSON.stringify(data)}
    
    Provide:
    1. Key findings
    2. Trends or patterns
    3. Recommendations
    4. Potential issues to watch
    
    Focus on actionable insights for factory operations.`

    return await this.generateResponse(prompt)
  }

  /**
   * Function calling for workspace operations
   */
  async determineWorkspaceAction(userQuery: string) {
    const prompt = `Determine the appropriate Google Workspace action for this user query:
    "${userQuery}"
    
    Available actions:
    - search_emails: Search for specific emails
    - send_email: Send a new email
    - create_calendar_event: Create a calendar event
    - search_drive: Search files in Google Drive
    - analyze_sheet: Analyze data from Google Sheets
    - create_document: Create a new document
    
    Response format:
    {
      "action": "action_name",
      "parameters": { ... relevant parameters ... },
      "explanation": "brief explanation"
    }`

    const response = await this.generateResponse(prompt)
    try {
      return JSON.parse(response)
    } catch {
      return { action: 'unknown', explanation: response }
    }
  }

  /**
   * Chat with context about emails and documents
   */
  async chatWithContext(message: string, conversationHistory: any[], workspaceContext?: any) {
    const historyString = conversationHistory.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n')

    const prompt = `You are an AI assistant for an ERP system with access to Google Workspace.
    
    Conversation History:
    ${historyString}
    
    Current Workspace Context:
    - Connected Email: ${workspaceContext?.email || 'Not specified'}
    - Recent Emails: ${workspaceContext?.recentEmails || 0}
    - Available Services: Gmail, Drive, Calendar, Docs, Sheets
    
    User: ${message}
    
    Provide a helpful response. If the user wants to perform an action, explain what you would do.`

    return await this.generateResponse(prompt)
  }
}

// Singleton instance
let geminiService: GeminiService | null = null

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService()
  }
  return geminiService
}