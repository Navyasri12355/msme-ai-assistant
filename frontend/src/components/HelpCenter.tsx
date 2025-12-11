import React, { useState, useMemo } from 'react';

interface HelpArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started',
    category: 'Getting Started',
    title: 'How do I get started?',
    content: 'Start by setting up your business profile, then add your transactions. The system will automatically analyze your data and provide insights.',
    keywords: ['start', 'begin', 'setup', 'first', 'new']
  },
  {
    id: 'add-transactions',
    category: 'Transactions',
    title: 'How do I add transactions?',
    content: 'Go to the Transactions page and click "Add Transaction". You can add them one by one or upload multiple transactions at once using a CSV file.',
    keywords: ['transaction', 'add', 'upload', 'income', 'expense', 'money']
  },
  {
    id: 'understand-dashboard',
    category: 'Dashboard',
    title: 'What do the dashboard numbers mean?',
    content: 'Daily Revenue shows your income for today. Total Customers is the count of unique customers. Top Products shows which items are selling best. Trends show if numbers are going up ↑ or down ↓ compared to before.',
    keywords: ['dashboard', 'metrics', 'revenue', 'customers', 'trends', 'numbers']
  },
  {
    id: 'cash-flow-forecast',
    category: 'Finance',
    title: 'What is cash flow forecast?',
    content: 'Cash flow forecast predicts your future income and expenses for the next 3 months based on your past patterns. It helps you plan ahead and avoid cash shortages.',
    keywords: ['forecast', 'prediction', 'future', 'cash flow', 'planning']
  },
  {
    id: 'marketing-strategies',
    category: 'Marketing',
    title: 'How do I get marketing advice?',
    content: 'Go to the Marketing page and click "Get Marketing Strategies". The system will suggest low-cost marketing ideas tailored to your business type and budget.',
    keywords: ['marketing', 'promotion', 'advertising', 'customers', 'strategies']
  },
  {
    id: 'content-ideas',
    category: 'Marketing',
    title: 'What are content suggestions?',
    content: 'Content suggestions are ideas for posts, messages, or promotions you can share with customers. Each suggestion includes what to say and where to share it (social media, SMS, etc.).',
    keywords: ['content', 'posts', 'social media', 'ideas', 'suggestions']
  },
  {
    id: 'sentiment-analysis',
    category: 'Marketing',
    title: 'What is customer sentiment?',
    content: 'Customer sentiment tells you if customers are happy (positive), unhappy (negative), or neutral about your business based on their feedback. It helps you understand what customers think.',
    keywords: ['sentiment', 'feedback', 'reviews', 'customers', 'opinion', 'happy']
  },
  {
    id: 'ai-chat',
    category: 'AI Assistant',
    title: 'How do I use the AI chat?',
    content: 'Go to the AI Chat page and type your question in plain language. For example: "How can I reduce costs?" or "What are my best selling products?". The AI will answer based on your business data.',
    keywords: ['chat', 'ai', 'assistant', 'questions', 'ask', 'help']
  },
  {
    id: 'insights',
    category: 'Dashboard',
    title: 'What are insights?',
    content: 'Insights are smart recommendations based on your business data. They tell you what actions to take to improve your business, like "Reduce spending on X" or "Focus on selling Y".',
    keywords: ['insights', 'recommendations', 'suggestions', 'advice', 'improve']
  },
  {
    id: 'alerts',
    category: 'Dashboard',
    title: 'What do alerts mean?',
    content: 'Alerts notify you when something needs attention, like when revenue drops below a certain level or expenses are unusually high. They help you catch problems early.',
    keywords: ['alerts', 'notifications', 'warnings', 'problems', 'attention']
  },
  {
    id: 'data-security',
    category: 'Security',
    title: 'Is my data safe?',
    content: 'Yes! All your business data is encrypted and secure. Only you can access your information. We use industry-standard security measures to protect your data.',
    keywords: ['security', 'safe', 'privacy', 'data', 'protection', 'encrypted']
  },
  {
    id: 'profile-setup',
    category: 'Getting Started',
    title: 'Why do I need to set up a business profile?',
    content: 'Your business profile helps the AI give you better, more personalized advice. It includes your business type, industry, and target customers so recommendations match your specific needs.',
    keywords: ['profile', 'business', 'setup', 'information', 'details']
  },
  {
    id: 'categories',
    category: 'Transactions',
    title: 'How are transactions categorized?',
    content: 'The system automatically categorizes transactions as income or expense based on the description and amount. You can also manually change categories if needed.',
    keywords: ['category', 'categorize', 'classification', 'type', 'organize']
  },
  {
    id: 'refresh-data',
    category: 'Dashboard',
    title: 'How do I update my dashboard?',
    content: 'Click the "Refresh" button at the top of the dashboard to get the latest data. The dashboard also updates automatically when you add new transactions.',
    keywords: ['refresh', 'update', 'reload', 'latest', 'current']
  }
];

interface HelpCenterProps {
  onClose: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = new Set(helpArticles.map(article => article.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredArticles = useMemo(() => {
    let filtered = helpArticles;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => {
        return (
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.keywords.some(keyword => keyword.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Help Center</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close help center"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map(article => (
                <div
                  key={article.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {article.category}
                    </span>
                  </div>
                  <p className="text-gray-700">{article.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try different keywords or browse all categories
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Still need help? Try asking the AI Chat assistant</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
