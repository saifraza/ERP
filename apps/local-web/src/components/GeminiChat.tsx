import { useState } from 'react'
import { Send, Sparkles, FileText, Calendar, Mail, HardDrive, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  action?: any
  actionResult?: any
}

interface GeminiChatProps {
  companyId?: string
  token: string
}

export default function GeminiChat({ companyId, token }: GeminiChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Gemini AI assistant. I can help you with emails, documents, calendar events, and more. What would you like to do today?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://cloud-api-production-0f4d.up.railway.app'
      const response = await fetch(`${apiUrl}/api/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
          companyId
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      
      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          action: data.action,
          actionResult: data.actionResult
        }
        setMessages(prev => [...prev, assistantMessage])

        // Show action result if any
        if (data.actionResult?.type === 'emails' && data.actionResult?.count > 0) {
          toast.success(`Found ${data.actionResult.count} emails`)
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error: any) {
      console.error('Gemini chat error:', error)
      toast.error('Failed to get AI response')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const suggestedPrompts = [
    { icon: Mail, text: "Process unread vendor emails", color: "text-blue-600" },
    { icon: FileText, text: "Extract invoice data from latest emails", color: "text-purple-600" },
    { icon: RefreshCw, text: "Auto-approve pending invoices under ₹1000", color: "text-green-600" },
    { icon: Send, text: "Send payment confirmations to vendors", color: "text-orange-600" }
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Gemini AI Assistant</h3>
            <p className="text-sm text-white/80">Powered by Google's most advanced AI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-lg px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Gemini</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Show action details if available */}
              {message.action && message.action.action !== 'unknown' && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs opacity-80">
                    Action: {message.action.action}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestedPrompts.map((prompt, index) => {
              const Icon = prompt.icon
              return (
                <button
                  key={index}
                  onClick={() => setInput(prompt.text)}
                  className="flex items-center gap-2 p-2 text-left text-xs bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Icon className={`h-4 w-4 ${prompt.color}`} />
                  <span className="text-gray-700 dark:text-gray-300">{prompt.text}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini anything about your workspace..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  )
}