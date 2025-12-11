import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import {
  generateStrategies,
  generateContentSuggestions,
  analyzeSentiment,
  getContentOutline,
  MarketingStrategy,
  ContentSuggestion,
  SentimentAnalysis,
  FeedbackInput,
} from '../api/marketing';
import { getErrorMessage, getErrorSuggestion } from '../api/client';

type TabType = 'strategies' | 'content' | 'sentiment';

export const Marketing: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('strategies');

  // Strategy state
  const [budget, setBudget] = useState<string>('');
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const [strategyError, setStrategyError] = useState<string>('');

  // Content state
  const [contentCount, setContentCount] = useState<string>('5');
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [contentOutline, setContentOutline] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingOutline, setLoadingOutline] = useState(false);
  const [contentError, setContentError] = useState<string>('');

  // Sentiment state
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackLanguage, setFeedbackLanguage] = useState<string>('en');
  const [feedbackList, setFeedbackList] = useState<FeedbackInput[]>([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysis | null>(null);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [sentimentError, setSentimentError] = useState<string>('');

  // Strategy handlers
  const handleGenerateStrategies = async () => {
    setLoadingStrategies(true);
    setStrategyError('');
    try {
      const budgetValue = budget ? parseFloat(budget) : undefined;
      const result = await generateStrategies(budgetValue);
      setStrategies(result);
    } catch (error) {
      const message = getErrorMessage(error);
      const suggestion = getErrorSuggestion(error);
      setStrategyError(suggestion ? `${message}. ${suggestion}` : message);
    } finally {
      setLoadingStrategies(false);
    }
  };

  // Content handlers
  const handleGenerateContent = async () => {
    setLoadingContent(true);
    setContentError('');
    setSelectedContent(null);
    setContentOutline('');
    try {
      const count = contentCount ? parseInt(contentCount) : undefined;
      const result = await generateContentSuggestions(count);
      setContentSuggestions(result);
    } catch (error) {
      const message = getErrorMessage(error);
      const suggestion = getErrorSuggestion(error);
      setContentError(suggestion ? `${message}. ${suggestion}` : message);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleViewOutline = async (contentId: string) => {
    setLoadingOutline(true);
    setContentError('');
    try {
      const outline = await getContentOutline(contentId);
      setContentOutline(outline);
      setSelectedContent(contentId);
    } catch (error) {
      const message = getErrorMessage(error);
      const suggestion = getErrorSuggestion(error);
      setContentError(suggestion ? `${message}. ${suggestion}` : message);
    } finally {
      setLoadingOutline(false);
    }
  };

  // Sentiment handlers
  const handleAddFeedback = () => {
    if (!feedbackText.trim()) {
      setSentimentError('Please enter feedback text');
      return;
    }

    setFeedbackList([
      ...feedbackList,
      {
        text: feedbackText,
        language: feedbackLanguage,
        source: 'manual',
      },
    ]);
    setFeedbackText('');
    setSentimentError('');
  };

  const handleRemoveFeedback = (index: number) => {
    setFeedbackList(feedbackList.filter((_, i) => i !== index));
  };

  const handleAnalyzeSentiment = async () => {
    if (feedbackList.length === 0) {
      setSentimentError('Please add at least one feedback entry');
      return;
    }

    setLoadingSentiment(true);
    setSentimentError('');
    try {
      const result = await analyzeSentiment(feedbackList);
      setSentimentAnalysis(result);
    } catch (error) {
      const message = getErrorMessage(error);
      const suggestion = getErrorSuggestion(error);
      setSentimentError(suggestion ? `${message}. ${suggestion}` : message);
    } finally {
      setLoadingSentiment(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Marketing Advisor</h2>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('strategies')}
                className={`${
                  activeTab === 'strategies'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Marketing Strategies
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Content Suggestions
              </button>
              <button
                onClick={() => setActiveTab('sentiment')}
                className={`${
                  activeTab === 'sentiment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Sentiment Analysis
              </button>
            </nav>
          </div>

          {/* Marketing Strategies Tab */}
          {activeTab === 'strategies' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generate Marketing Strategies
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                      Budget (Optional)
                    </label>
                    <input
                      type="number"
                      id="budget"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Enter your marketing budget"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty for strategies at all budget levels
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateStrategies}
                    disabled={loadingStrategies}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                  >
                    {loadingStrategies ? 'Generating...' : 'Generate Strategies'}
                  </button>
                  {strategyError && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{strategyError}</p>
                    </div>
                  )}
                </div>
              </div>

              {strategies.length > 0 && (
                <div className="space-y-4">
                  {strategies.map((strategy) => (
                    <div key={strategy.id} className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-gray-900">{strategy.title}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(
                            strategy.difficulty
                          )}`}
                        >
                          {strategy.difficulty.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{strategy.description}</p>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Estimated Cost</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{strategy.estimatedCost.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expected Reach</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {strategy.expectedReach.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Timeline</p>
                          <p className="text-lg font-semibold text-gray-900">{strategy.timeline}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Action Steps:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          {strategy.actionSteps.map((step, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content Suggestions Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generate Content Suggestions
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="count" className="block text-sm font-medium text-gray-700">
                      Number of Suggestions
                    </label>
                    <input
                      type="number"
                      id="count"
                      value={contentCount}
                      onChange={(e) => setContentCount(e.target.value)}
                      min="1"
                      max="20"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    onClick={handleGenerateContent}
                    disabled={loadingContent}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                  >
                    {loadingContent ? 'Generating...' : 'Generate Content Ideas'}
                  </button>
                  {contentError && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{contentError}</p>
                    </div>
                  )}
                </div>
              </div>

              {contentSuggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contentSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-medium text-gray-900">{suggestion.title}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getEffortColor(
                            suggestion.estimatedEffort
                          )}`}
                        >
                          {suggestion.estimatedEffort.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Platform:</span> {suggestion.platform}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Type:</span> {suggestion.contentType}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Potential Reach:</span>{' '}
                          {suggestion.potentialReach.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Relevance:</span> {suggestion.relevance}
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewOutline(suggestion.id)}
                        disabled={loadingOutline && selectedContent === suggestion.id}
                        className="w-full inline-flex justify-center items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        {loadingOutline && selectedContent === suggestion.id
                          ? 'Loading...'
                          : 'View Outline'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {contentOutline && selectedContent && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Content Outline</h3>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
                      {contentOutline}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sentiment Analysis Tab */}
          {activeTab === 'sentiment' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Customer Feedback</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <select
                      id="language"
                      value={feedbackLanguage}
                      onChange={(e) => setFeedbackLanguage(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="ta">Tamil</option>
                      <option value="te">Telugu</option>
                      <option value="bn">Bengali</option>
                      <option value="mr">Marathi</option>
                      <option value="gu">Gujarati</option>
                      <option value="kn">Kannada</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                      Feedback Text
                    </label>
                    <textarea
                      id="feedback"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={3}
                      placeholder="Enter customer feedback..."
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddFeedback}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Add Feedback
                  </button>
                </div>
              </div>

              {feedbackList.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Feedback List ({feedbackList.length})
                  </h3>
                  <div className="space-y-2 mb-4">
                    {feedbackList.map((feedback, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start p-3 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{feedback.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Language: {feedback.language}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFeedback(index)}
                          className="ml-4 text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAnalyzeSentiment}
                    disabled={loadingSentiment}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                  >
                    {loadingSentiment ? 'Analyzing...' : 'Analyze Sentiment'}
                  </button>
                  {sentimentError && (
                    <div className="rounded-md bg-red-50 p-4 mt-4">
                      <p className="text-sm text-red-800">{sentimentError}</p>
                    </div>
                  )}
                </div>
              )}

              {sentimentAnalysis && (
                <div className="space-y-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Sentiment</h3>
                    <div className="flex items-center justify-center mb-6">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-gray-900">
                          {sentimentAnalysis.overallScore.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">Sentiment Score (0-100)</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-green-600">
                          {sentimentAnalysis.distribution.positive}%
                        </p>
                        <p className="text-sm text-gray-600">Positive</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-gray-600">
                          {sentimentAnalysis.distribution.neutral}%
                        </p>
                        <p className="text-sm text-gray-600">Neutral</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-red-600">
                          {sentimentAnalysis.distribution.negative}%
                        </p>
                        <p className="text-sm text-gray-600">Negative</p>
                      </div>
                    </div>
                  </div>

                  {sentimentAnalysis.keyTopics.length > 0 && (
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Key Topics</h3>
                      <div className="space-y-3">
                        {sentimentAnalysis.keyTopics.map((topic, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{topic.topic}</p>
                              <p className="text-xs text-gray-500">
                                Mentioned {topic.frequency} times
                              </p>
                            </div>
                            <span
                              className={`text-sm font-medium ${getSentimentColor(
                                topic.sentiment
                              )}`}
                            >
                              {topic.sentiment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sentimentAnalysis.negativeIssues.length > 0 && (
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Issues to Address</h3>
                      <div className="space-y-3">
                        {sentimentAnalysis.negativeIssues.map((issue, index) => (
                          <div key={index} className="p-3 bg-red-50 rounded">
                            <div className="flex justify-between items-start">
                              <p className="text-sm text-gray-900 flex-1">{issue.description}</p>
                              <span
                                className={`ml-4 px-2 py-1 text-xs font-medium rounded ${
                                  issue.severity === 'high'
                                    ? 'bg-red-200 text-red-800'
                                    : issue.severity === 'medium'
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : 'bg-gray-200 text-gray-800'
                                }`}
                              >
                                {issue.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Frequency: {issue.frequency}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sentimentAnalysis.languageBreakdown.length > 0 && (
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Language Breakdown
                      </h3>
                      <div className="space-y-2">
                        {sentimentAnalysis.languageBreakdown.map((lang, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-900">{lang.language}</span>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-600">{lang.count} feedback</span>
                              <span className="text-sm font-medium text-gray-900">
                                Score: {lang.averageSentiment.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
