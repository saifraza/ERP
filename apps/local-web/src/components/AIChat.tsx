import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface AIChatProps {
  onClose?: () => void
}

export default function AIChat({ onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your ERP AI assistant. I can help you with:\n\n• Production status and metrics\n• Farmer information and payments\n• Efficiency analysis and optimization\n• Custom reports and insights\n• Predictive maintenance alerts\n• 📧 Gmail document processing\n• 📄 Invoice and PO analysis\n\nWhat would you like to know about your factory operations?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Simulate AI response - in real implementation, this would call the MCP server
      const aiResponse = await simulateAIResponse(inputValue)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary-50">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {message.type === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              <div
                className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about production, farmers, Gmail documents, invoices..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Simulate AI responses based on user input
async function simulateAIResponse(input: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('production') || lowerInput.includes('status')) {
    return `📊 **Current Production Status**

**Sugar Division:** 2,450 MT (98% of target)
**Power Division:** 12.5 MW generated, 8.5 MW exported  
**Ethanol Division:** 45,000 L (102% of target) ✅
**Animal Feed:** 890 MT (99% of target)

**Overall Efficiency:** 92.5%
**Status:** All systems operational

Would you like detailed analysis for any specific division?`
  }

  if (lowerInput.includes('farmer') || lowerInput.includes('payment')) {
    return `👨‍🌾 **Farmer Management Summary**

**Active Farmers:** 247
**Pending Payments:** ₹12,50,000 (15 farmers)
**Recent Deliveries:** 45 today

**Top Farmers by Volume:**
• Ramesh Patel - 125 MT this month
• Suresh Kumar - 98 MT this month  
• Priya Sharma - 87 MT this month

**Alerts:**
⚠️ 3 farmers have pending payments > 30 days

Need specific farmer information? Just ask!`
  }

  if (lowerInput.includes('efficiency') || lowerInput.includes('optimize')) {
    return `⚡ **Efficiency Analysis & Recommendations**

**Current Performance:**
• Sugar: 92.5% (Target: 95%) - 2.5% gap
• Power: 88.3% (Target: 90%) - 1.7% gap  
• Ethanol: 94.1% (Target: 93%) - Exceeding! ✅
• Feed: 87.2% (Target: 89%) - 1.8% gap

**AI Recommendations:**
1. **Sugar:** Optimize crushing mill settings - potential 1.5% improvement
2. **Power:** Check boiler efficiency - schedule maintenance
3. **Feed:** Review pelletizing moisture control

**Estimated Impact:** +₹45,000 daily revenue if implemented`
  }

  if (lowerInput.includes('maintenance') || lowerInput.includes('equipment')) {
    return `🔧 **Predictive Maintenance Alerts**

**URGENT (Next 7 days):**
⚠️ Boiler #1 - 75% failure probability
   Recommended: Immediate inspection

**SCHEDULED:**
• Crushing Mill #2 - Due in 3 days
• Distillation Column - Due next week

**AI PREDICTION:**
Preventive maintenance now: ₹50,000
Breakdown repair cost: ₹2,50,000

**Recommendation:** Schedule maintenance this weekend`
  }

  if (lowerInput.includes('report') || lowerInput.includes('summary')) {
    return `📈 **Daily Operations Report**

**Production Highlights:**
✅ Ethanol exceeded target by 2%
⚠️ Sugar 2% below target
📊 Overall achievement: 99.8%

**Financial Summary:**
💰 Revenue: ₹4,84,50,000
💸 Pending: ₹21,25,000

**Key Actions Needed:**
1. Process sugar mill adjustment
2. Schedule boiler maintenance  
3. Clear pending farmer payments

**Tomorrow's Forecast:** Good weather, expect normal operations`
  }

  if (lowerInput.includes('gmail') || lowerInput.includes('email') || lowerInput.includes('mail')) {
    return `📧 **Gmail Integration (MCP Server)**

I can help you with Gmail operations through our MCP server:

**Available Commands:**
• 📥 "List my emails" - Show recent emails
• 📤 "Send test email" - Send a test message
• 📅 "Show calendar events" - View upcoming events
• 📎 "Extract attachments from emails" - Process documents
• 🔍 "Search emails from suppliers" - Find specific emails

**MCP Server Status:**
✅ OAuth configured
✅ Railway deployment active
✅ Internal networking enabled

**Quick Actions:**
1. Go to **Mails** page in the menu to see the Gmail interface
2. Click "Fetch Emails" to load your messages
3. Use "Send Test" to verify email sending

Would you like me to help you with any specific Gmail operation?`
  }

  if (lowerInput.includes('invoice') || lowerInput.includes('bill')) {
    return `📄 **Invoice Processing via Gmail**

**Recent Invoices Found:**
• INV-2025-001: ₹50,000 from Engineering Solutions Ltd
• INV-2025-002: ₹75,000 from Industrial Supplies Co
• INV-2025-003: ₹25,000 from Tech Services Inc

**Status:**
✅ 2 invoices processed and stored
⏳ 1 invoice pending approval

**AI Analysis:**
• Total pending: ₹1,50,000
• Average payment terms: Net 30 days
• Early payment discount available: 2%

Shall I process the pending invoice?`
  }

  if (lowerInput.includes('purchase order') || lowerInput.includes('po')) {
    return `📋 **Purchase Order Management**

**Recent POs from Gmail:**
• PO-2025-045: Equipment supply (₹1,25,000)
• PO-2025-046: Raw materials (₹2,50,000)
• PO-2025-047: Spare parts (₹45,000)

**AI Insights:**
✅ All within approved budget
⚠️ PO-2025-046 has bulk discount opportunity
📊 Total procurement this month: ₹8,75,000

**Recommendations:**
• Consolidate orders for 5% discount
• Review delivery schedules
• Verify vendor compliance

Need me to process any specific PO?`
  }

  if (lowerInput.includes('document') || lowerInput.includes('attachment')) {
    return `📊 **Document Management System**

**Gmail Integration Status:**
✅ Connected to your Gmail account
📥 Auto-processing enabled for supplier emails

**Recent Documents:**
• 15 documents processed today
• 8 invoices, 5 POs, 2 contracts
• 98% extraction accuracy

**Document Types I Can Process:**
• Invoices (PDF, images)
• Purchase orders
• Contracts
• Supplier offers
• Delivery notes

Would you like to:
• "Check Gmail for new documents"
• "View document analytics"
• "Process pending attachments"`
  }

  // Default response for general queries
  return `I understand you're asking about "${input}". 

I can help you with:

🏭 **Production:** Current status, targets, and performance
👨‍🌾 **Farmers:** Information, payments, and deliveries  
⚡ **Efficiency:** Analysis and optimization suggestions
📊 **Reports:** Custom reports and analytics
🔧 **Maintenance:** Predictive alerts and scheduling
📧 **Gmail:** Process emails and extract documents
📄 **Documents:** Analyze invoices, POs, and contracts

Could you be more specific about what you'd like to know? For example:
• "What's today's sugar production?"
• "Show me farmers with pending payments"
• "Check Gmail for new invoices"
• "Process supplier emails"`
}