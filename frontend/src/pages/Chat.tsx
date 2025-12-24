import { useState, useEffect, useRef } from 'react';
import { conversationalAIApi, Message, AIResponse } from '../api/conversationalAI';
import { getErrorMessage, getErrorSuggestion } from '../api/client';
import { Navigation } from '../components/Navigation';

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await conversationalAIApi.getHistory(50);
      setMessages(history);
    } catch (err) {
      console.error('Failed to load history:', err);
      // Don't show error for history loading failure
    } finally {
      setLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Clear any previous errors
    setError(null);
    setErrorSuggestion(null);

    // Create user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Build context from recent messages
      const context = {
        previousMessages: messages.slice(-5), // Last 5 messages for context
      };

      // Send query to API
      const response: AIResponse = await conversationalAIApi.sendQuery(trimmedInput, context);

      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle clarification questions
      if (response.requiresClarification && response.clarificationQuestions) {
        // Could display these as quick reply buttons
        console.log('Clarification needed:', response.clarificationQuestions);
      }

      // Handle suggestions
      if (response.suggestions && response.suggestions.length > 0) {
        // Could display these as quick reply buttons
        console.log('Suggestions:', response.suggestions);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      const suggestion = getErrorSuggestion(err);
      
      setError(errorMsg);
      setErrorSuggestion(suggestion || null);

      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${errorMsg}${suggestion ? ` ${suggestion}` : ''}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleClearContext = async () => {
    if (!confirm('Are you sure you want to clear the conversation context? This will start a fresh conversation.')) {
      return;
    }

    try {
      await conversationalAIApi.clearContext();
      setMessages([]);
      setError(null);
      setErrorSuggestion(null);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit input to 500 characters as per requirements
    if (value.length <= 500) {
      setInputValue(value);
      setError(null);
      setErrorSuggestion(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Chat Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Business Assistant</h1>
              <p className="text-sm text-gray-600 mt-1">
                Ask me anything about your business
              </p>
              <div className="flex items-center mt-2">
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Context-Aware: I know your business profile & transactions
                </div>
              </div>
            </div>
            <button
              onClick={handleClearContext}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Context
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 250px)' }}>
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">Loading conversation...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700">Start a conversation</p>
                  <p className="text-sm text-gray-500 mt-2">
                    I already know about your business profile and transactions.<br />
                    Ask me about cost-cutting, growth strategies, financial insights, or marketing advice!
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 max-w-md">
                    <button
                      onClick={() => setInputValue("How can I reduce my costs?")}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-700 transition-colors"
                    >
                      💰 Reduce costs
                    </button>
                    <button
                      onClick={() => setInputValue("How can I grow my business?")}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-700 transition-colors"
                    >
                      📈 Growth strategies
                    </button>
                    <button
                      onClick={() => setInputValue("Show me my financial performance")}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-700 transition-colors"
                    >
                      📊 Financial analysis
                    </button>
                    <button
                      onClick={() => setInputValue("What marketing strategies should I use?")}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-700 transition-colors"
                    >
                      📢 Marketing advice
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 p-4">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
                {errorSuggestion && (
                  <p className="text-sm text-red-600 mt-1">{errorSuggestion}</p>
                )}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Ask a question about your business..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Send'
                )}
              </button>
            </form>
            
            <div className="mt-2 text-xs text-gray-500 text-right">
              {inputValue.length}/500 characters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
